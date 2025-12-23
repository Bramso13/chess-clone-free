/**
 * Script de validation et d'insertion des problèmes tactiques dans Supabase
 * Usage: npm run seed:tactics
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { ChessService, InvalidFenError } from "@/lib/chess/chessService";
import "dotenv/config";

/**
 * Interface pour les problèmes tactiques du fichier JSON
 */
interface TacticalProblemData {
  position_fen: string;
  solution_moves: string[];
  difficulty: "Facile" | "Moyen" | "Difficile";
  tactic_type: string;
  explanation: string;
  source: string;
}

/**
 * Résultat de validation d'un problème tactique
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
  problem?: TacticalProblemData;
}

/**
 * Statistiques du processus de seed
 */
interface SeedStats {
  total: number;
  validated: number;
  failed: number;
  inserted: number;
  errors: string[];
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
};

/**
 * Log avec couleur
 */
function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Valide une position FEN
 */
export function validatePositionFEN(fen: string): boolean {
  try {
    ChessService.loadPosition(fen);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Valide un problème tactique complet
 * Vérifie que la position FEN est valide et que tous les coups de solution sont légaux
 */
export function validateTacticalProblem(
  problem: TacticalProblemData
): ValidationResult {
  // Validation de la position FEN
  let game;
  try {
    game = ChessService.loadPosition(problem.position_fen);
  } catch (error) {
    return {
      isValid: false,
      error: `Position FEN invalide: ${problem.position_fen}`,
      problem,
    };
  }

  // Validation des coups de solution
  for (let i = 0; i < problem.solution_moves.length; i++) {
    const move = problem.solution_moves[i];

    try {
      const validationResult = ChessService.validateMove(game, move);

      if (!validationResult.isValid) {
        return {
          isValid: false,
          error: `Coup ${i + 1} invalide: ${move} - ${validationResult.error}`,
          problem,
        };
      }

      // Exécuter le coup pour continuer la validation
      ChessService.makeMove(game, move);
    } catch (error) {
      return {
        isValid: false,
        error: `Erreur lors de l'exécution du coup ${i + 1}: ${move} - ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        problem,
      };
    }
  }

  return {
    isValid: true,
    problem,
  };
}

/**
 * Charge les problèmes depuis le fichier JSON
 */
function loadProblemsFromFile(): TacticalProblemData[] {
  const filePath = resolve(
    process.cwd(),
    "data/tactics/tactical-problems-seed.json"
  );

  try {
    const fileContent = readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (!data.problems || !Array.isArray(data.problems)) {
      throw new Error("Format JSON invalide: propriété 'problems' manquante");
    }

    return data.problems;
  } catch (error) {
    log(
      `❌ Erreur lors de la lecture du fichier: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      "red"
    );
    throw error;
  }
}

/**
 * Insère les problèmes validés dans Supabase
 */
async function insertProblems(
  problems: TacticalProblemData[]
): Promise<{ inserted: number; errors: string[] }> {
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifiez .env.local"
    );
  }

  log(`\n🔗 Connexion à Supabase: ${supabaseUrl}`, "blue");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let inserted = 0;
  const errors: string[] = [];

  log(`\n📤 Insertion dans Supabase...`, "blue");

  for (const problem of problems) {
    try {
      const { error } = await supabase.from("tactical_problems").insert({
        position_fen: problem.position_fen,
        solution_moves: problem.solution_moves,
        difficulty: problem.difficulty,
        tactic_type: problem.tactic_type,
        explanation: problem.explanation,
        source: problem.source,
      });

      if (error) {
        const errorMsg = `Erreur d'insertion pour ${problem.tactic_type}: ${error.message}`;
        errors.push(errorMsg);
        log(`  ❌ ${errorMsg}`, "red");
      } else {
        inserted++;
        log(`  ✓ ${problem.difficulty} - ${problem.tactic_type}`, "green");
      }
    } catch (error) {
      const errorMsg = `Exception lors de l'insertion: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`;
      errors.push(errorMsg);
      log(`  ❌ ${errorMsg}`, "red");
    }
  }

  return { inserted, errors };
}

/**
 * Fonction principale de seed
 */
async function seedTacticalProblems() {
  log("\n" + "=".repeat(60), "bright");
  log("🎯 SEED DES PROBLÈMES TACTIQUES", "bright");
  log("=".repeat(60) + "\n", "bright");

  const stats: SeedStats = {
    total: 0,
    validated: 0,
    failed: 0,
    inserted: 0,
    errors: [],
  };

  try {
    // 1. Chargement des données
    log("📂 Chargement des problèmes depuis le fichier JSON...", "blue");
    const problems = loadProblemsFromFile();
    stats.total = problems.length;
    log(`  ✓ ${problems.length} problèmes chargés`, "green");

    // 2. Validation des problèmes
    log("\n🔍 Validation des problèmes...", "blue");
    const validatedProblems: TacticalProblemData[] = [];

    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      const result = validateTacticalProblem(problem);

      if (result.isValid) {
        validatedProblems.push(problem);
        stats.validated++;
        log(
          `  ✓ [${i + 1}/${problems.length}] ${problem.difficulty} - ${
            problem.tactic_type
          }`,
          "green"
        );
      } else {
        stats.failed++;
        const errorMsg = `[${i + 1}/${problems.length}] ${result.error}`;
        stats.errors.push(errorMsg);
        log(`  ❌ ${errorMsg}`, "red");
      }
    }

    // 3. Insertion dans Supabase
    if (validatedProblems.length > 0) {
      const { inserted, errors } = await insertProblems(validatedProblems);
      stats.inserted = inserted;
      stats.errors.push(...errors);
    } else {
      log("\n⚠️  Aucun problème valide à insérer", "yellow");
    }

    // 4. Affichage des statistiques finales
    log("\n" + "=".repeat(60), "bright");
    log("📊 RÉSUMÉ", "bright");
    log("=".repeat(60), "bright");
    log(`Total de problèmes   : ${stats.total}`, "blue");
    log(`✓ Validés            : ${stats.validated}`, "green");
    log(
      `❌ Échecs validation : ${stats.failed}`,
      stats.failed > 0 ? "red" : "blue"
    );
    log(`✓ Insérés            : ${stats.inserted}`, "green");
    log(
      `❌ Échecs insertion  : ${stats.errors.length - stats.failed}`,
      stats.errors.length - stats.failed > 0 ? "red" : "blue"
    );

    if (stats.errors.length > 0 && stats.failed > 0) {
      log("\n⚠️  Erreurs détectées:", "yellow");
      stats.errors.forEach((error) => log(`  - ${error}`, "red"));
    }

    log("\n" + "=".repeat(60) + "\n", "bright");

    if (stats.inserted === stats.validated && stats.validated === stats.total) {
      log("✅ Seed terminé avec succès!", "green");
      process.exit(0);
    } else if (stats.inserted > 0) {
      log("⚠️  Seed terminé avec quelques erreurs", "yellow");
      process.exit(0);
    } else {
      log("❌ Échec du seed", "red");
      process.exit(1);
    }
  } catch (error) {
    log(
      `\n❌ Erreur fatale: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      "red"
    );
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  seedTacticalProblems();
}

// Export pour les tests
export { seedTacticalProblems, loadProblemsFromFile, insertProblems };
