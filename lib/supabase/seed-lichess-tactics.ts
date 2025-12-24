/**
 * Script de seed pour importer les puzzles tactiques Lichess depuis un fichier CSV
 * Usage: npm run seed:lichess-tactics
 */

import { createReadStream } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import Papa from "papaparse";
import { validateLichessPuzzle } from "@/lib/tactics/lichessDataValidator";
import {
  transformCsvRowToTacticalProblem,
  type LichessCsvRow,
  type ParsedTacticalProblem,
} from "@/lib/tactics/lichessCsvImportService";
import type { TacticalProblem } from "@/types/chess";

// Charger les variables d'environnement
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

if (require("fs").existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (require("fs").existsSync(envPath)) {
  config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env or .env.local file."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Statistiques du processus de seed
 */
interface SeedStats {
  total: number;
  parsed: number;
  validated: number;
  invalid: number;
  duplicates: number;
  inserted: number;
  skipped: number;
  errors: string[];
  startTime: number;
  endTime?: number;
}

/**
 * Couleur pour les logs dans la console
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Log avec couleur
 */
function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Convertit un ParsedTacticalProblem en TacticalProblem pour insertion
 */
function convertToTacticalProblem(
  puzzle: ParsedTacticalProblem
): Omit<TacticalProblem, "id" | "created_at"> {
  return {
    position_fen: puzzle.position_fen,
    solution_moves: puzzle.solution_moves,
    difficulty: puzzle.difficulty,
    tactic_type: puzzle.tactic_type,
    explanation: puzzle.explanation,
    source: "imported",
  };
}

/**
 * Insère les puzzles dans Supabase par batch
 * @param puzzles - Puzzles à insérer
 * @returns Statistiques d'insertion
 */
async function insertPuzzlesBatch(
  puzzles: ParsedTacticalProblem[]
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const batchSize = 50;
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Convertir les puzzles en format TacticalProblem
  const puzzlesToInsert = puzzles.map(convertToTacticalProblem);

  // Traiter par batch
  for (let i = 0; i < puzzlesToInsert.length; i += batchSize) {
    const batch = puzzlesToInsert.slice(i, i + batchSize);

    try {
      // Utiliser upsert avec position_fen comme clé unique pour éviter les doublons
      // Note: On utilise une approche de vérification manuelle car position_fen n'est pas une clé unique dans la DB
      // On vérifie d'abord si les puzzles existent déjà
      const fens = batch.map((p) => p.position_fen);

      const { data: existing, error: checkError } = await supabase
        .from("tactical_problems")
        .select("position_fen")
        .in("position_fen", fens);

      if (checkError) {
        errors.push(
          `Erreur lors de la vérification des doublons (batch ${i / batchSize + 1}): ${checkError.message}`
        );
        continue;
      }

      const existingFens = new Set(existing?.map((p) => p.position_fen) || []);
      const toInsert = batch.filter((p) => !existingFens.has(p.position_fen));

      if (toInsert.length === 0) {
        skipped += batch.length;
        log(
          `  ⏭️  Batch ${i / batchSize + 1}: Tous les puzzles existent déjà (${batch.length} ignorés)`,
          "yellow"
        );
        continue;
      }

      const { data, error } = await supabase
        .from("tactical_problems")
        .insert(toInsert)
        .select();

      if (error) {
        errors.push(
          `Erreur lors de l'insertion du batch ${i / batchSize + 1}: ${error.message}`
        );
        skipped += toInsert.length;
      } else {
        inserted += data?.length || 0;
        skipped += batch.length - (data?.length || 0);
        log(
          `  ✓ Batch ${i / batchSize + 1}: ${data?.length || 0} puzzles insérés`,
          "green"
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      errors.push(
        `Erreur fatale lors de l'insertion du batch ${i / batchSize + 1}: ${errorMsg}`
      );
      skipped += batch.length;
    }
  }

  return { inserted, skipped, errors };
}

/**
 * Fonction principale de seed
 */
async function seedLichessTactics() {
  log("\n" + "=".repeat(60), "bright");
  log("🎯 SEED DES PUZZLES TACTIQUES LICHESS", "bright");
  log("=".repeat(60) + "\n", "bright");

  const stats: SeedStats = {
    total: 0,
    parsed: 0,
    validated: 0,
    invalid: 0,
    duplicates: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    startTime: Date.now(),
  };

  try {
    // 1. Ouvrir le fichier CSV en stream
    const csvPath = resolve(process.cwd(), "data/tactics/lichess-puzzles.csv");
    log("📂 Lecture du fichier CSV en streaming...", "blue");
    log(`  Fichier: ${csvPath}`, "blue");

    const validPuzzles: ParsedTacticalProblem[] = [];
    const processedFens = new Set<string>(); // Pour détecter les doublons
    let lineNumber = 1; // Header = ligne 1
    let parsedCount = 0;
    let errorCount = 0;
    const processingBatchSize = 100; // Traiter par batch de 100 puzzles

    // Créer un stream de lecture
    const fileStream = createReadStream(csvPath, { encoding: "utf-8" });

    // Parser le CSV en streaming avec PapaParse
    await new Promise<void>((resolve, reject) => {
      Papa.parse<LichessCsvRow>(fileStream, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        step: (result, parser) => {
          lineNumber++;

          if (result.errors.length > 0) {
            errorCount++;
            stats.errors.push(
              `Ligne ${lineNumber}: ${result.errors.map((e) => e.message).join(", ")}`
            );
            if (errorCount <= 5) {
              log(
                `  ❌ Ligne ${lineNumber}: ${result.errors[0].message}`,
                "red"
              );
            }
            return;
          }

          const row = result.data;

          // Ignorer les lignes vides
          if (!row || Object.keys(row).length === 0) {
            return;
          }

          // Transformer la ligne en problème tactique
          const transformResult = transformCsvRowToTacticalProblem(
            row,
            lineNumber
          );

          if (transformResult.error) {
            errorCount++;
            stats.errors.push(
              `Ligne ${transformResult.error.line}: ${transformResult.error.message}`
            );
            if (errorCount <= 5) {
              log(
                `  ❌ Ligne ${transformResult.error.line}: ${transformResult.error.message}`,
                "red"
              );
            }
            return;
          }

          if (transformResult.problem) {
            parsedCount++;
            stats.total++;

            // Valider le puzzle
            const validationResult = validateLichessPuzzle(
              transformResult.problem
            );

            if (validationResult.isValid && validationResult.problem) {
              // Détecter et ignorer les doublons
              const fen = transformResult.problem.position_fen;
              if (!processedFens.has(fen)) {
                processedFens.add(fen);
                validPuzzles.push(transformResult.problem);
                stats.validated++;

                // Traiter par batch pour libérer la mémoire
                if (validPuzzles.length >= processingBatchSize) {
                  parser.pause(); // Pause le parsing

                  // Insérer le batch actuel
                  insertPuzzlesBatch(validPuzzles.slice())
                    .then((insertResult) => {
                      stats.inserted += insertResult.inserted;
                      stats.skipped += insertResult.skipped;
                      stats.errors.push(...insertResult.errors);

                      // Vider le batch
                      validPuzzles.length = 0;

                      // Reprendre le parsing
                      parser.resume();
                    })
                    .catch((err) => {
                      stats.errors.push(
                        `Erreur lors de l'insertion du batch: ${err instanceof Error ? err.message : "Erreur inconnue"}`
                      );
                      parser.resume();
                    });
                }
              } else {
                stats.duplicates++;
                stats.skipped++;
              }
            } else {
              stats.invalid++;
              if (validationResult.error) {
                stats.errors.push(
                  `Ligne ${lineNumber}: ${validationResult.error}`
                );
              }
            }
          }

          // Afficher progression tous les 1000 puzzles
          if (stats.total % 1000 === 0) {
            log(
              `  📊 Progression: ${stats.total} lignes traitées, ${stats.validated} valides, ${stats.inserted} insérés...`,
              "cyan"
            );
          }
        },
        complete: (results) => {
          log(`\n📖 Parsing terminé: ${stats.total} lignes traitées`, "green");
          log(`  ✓ ${parsedCount} puzzles parsés avec succès`, "green");
          if (errorCount > 0) {
            log(`  ❌ ${errorCount} erreurs de parsing`, "red");
          }
          resolve();
        },
        error: (error) => {
          reject(new Error(`Erreur lors du parsing CSV: ${error.message}`));
        },
      });
    });

    // Insérer les puzzles restants
    if (validPuzzles.length > 0) {
      log("\n💾 Insertion des puzzles restants dans Supabase...", "blue");
      const insertResult = await insertPuzzlesBatch(validPuzzles);
      stats.inserted += insertResult.inserted;
      stats.skipped += insertResult.skipped;
      stats.errors.push(...insertResult.errors);
    }

    // 7. Statistiques finales
    stats.endTime = Date.now();
    const duration = ((stats.endTime - stats.startTime) / 1000).toFixed(2);

    log("\n" + "=".repeat(60), "bright");
    log("📊 RÉSUMÉ", "bright");
    log("=".repeat(60), "bright");
    log(`Total dans CSV        : ${stats.total}`, "blue");
    log(`✓ Parsés              : ${parsedCount}`, "green");
    log(`✓ Validés             : ${stats.validated}`, "green");
    log(
      `❌ Invalides          : ${stats.invalid}`,
      stats.invalid > 0 ? "red" : "blue"
    );
    log(
      `⚠️  Doublons           : ${stats.duplicates}`,
      stats.duplicates > 0 ? "yellow" : "blue"
    );
    log(`✓ Insérés (nouveaux)  : ${stats.inserted}`, "green");
    log(`⏭️  Ignorés (existants): ${stats.skipped}`, "yellow");
    log(`⏱️  Temps d'exécution  : ${duration}s`, "cyan");

    if (stats.errors.length > 0) {
      log("\n⚠️  Erreurs rencontrées:", "yellow");
      stats.errors.slice(0, 10).forEach((error) => {
        log(`  - ${error}`, "red");
      });
      if (stats.errors.length > 10) {
        log(`  ... et ${stats.errors.length - 10} autres erreurs`, "yellow");
      }
    }

    log("\n" + "=".repeat(60) + "\n", "bright");

    if (stats.inserted > 0) {
      log("✅ Seed terminé avec succès!", "green");
      process.exit(0);
    } else if (stats.skipped > 0) {
      log("⚠️  Aucun nouveau puzzle inséré (tous existaient déjà)", "yellow");
      process.exit(0);
    } else {
      log("❌ Échec du seed (aucun puzzle inséré)", "red");
      process.exit(1);
    }
  } catch (error) {
    stats.endTime = Date.now();
    const duration = ((stats.endTime - stats.startTime) / 1000).toFixed(2);

    log(
      `\n❌ Erreur fatale: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      "red"
    );
    log(`⏱️  Temps avant erreur: ${duration}s`, "cyan");
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
seedLichessTactics();
