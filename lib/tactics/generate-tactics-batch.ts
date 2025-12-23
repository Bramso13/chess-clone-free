/**
 * Script de génération batch de problèmes tactiques
 * Usage: npm run generate:tactics [-- --count=20 --minMoves=2 --maxMoves=5]
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { TacticGeneratorService } from "./tacticGeneratorService";
import { getStockfishService } from "@/lib/stockfish/stockfishService";
import "dotenv/config";

/**
 * Options de génération depuis la ligne de commande
 */
interface BatchOptions {
  count?: number;
  minMoves?: number;
  maxMoves?: number;
  exactMoves?: number;
  depth?: number;
  pgnFile?: string;
}

/**
 * Statistiques de génération
 */
interface GenerationStats {
  totalGenerated: number;
  saved: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

/**
 * Couleurs pour les logs dans la console
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs(): BatchOptions {
  const args = process.argv.slice(2);
  const options: BatchOptions = {};

  for (const arg of args) {
    if (arg.startsWith("--count=")) {
      options.count = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--minMoves=")) {
      options.minMoves = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--maxMoves=")) {
      options.maxMoves = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--exactMoves=")) {
      options.exactMoves = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--depth=")) {
      options.depth = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--pgnFile=")) {
      options.pgnFile = arg.split("=")[1];
    }
  }

  return options;
}

/**
 * Affiche un message avec couleur
 */
function log(message: string, color: keyof typeof colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Affiche les statistiques de génération
 */
function displayStats(stats: GenerationStats): void {
  log("\n" + "=".repeat(50), "bright");
  log("Statistiques de génération", "bright");
  log("=".repeat(50), "bright");
  log(`Total généré: ${stats.totalGenerated}`, "cyan");
  log(`Sauvegardé: ${stats.saved}`, "green");
  log(`Ignoré (duplications): ${stats.skipped}`, "yellow");
  log(`Erreurs: ${stats.errors}`, stats.errors > 0 ? "red" : "reset");
  
  if (stats.errorMessages.length > 0) {
    log("\nMessages d'erreur:", "red");
    stats.errorMessages.forEach((msg, i) => {
      log(`  ${i + 1}. ${msg}`, "red");
    });
  }
  
  log("=".repeat(50) + "\n", "bright");
}

/**
 * Fonction principale de génération batch
 */
async function main(): Promise<void> {
  try {
    log("🚀 Démarrage de la génération batch de tactiques", "bright");
    log("", "reset");

    // Parser les arguments
    const options = parseArgs();
    const count = options.count ?? 20;
    const pgnFile = options.pgnFile ?? resolve(__dirname, "../../data/tactics/games-source.pgn");

    log(`📁 Fichier PGN: ${pgnFile}`, "cyan");
    log(`🎯 Nombre de tactiques à générer: ${count}`, "cyan");
    
    if (options.minMoves !== undefined || options.maxMoves !== undefined) {
      log(`📏 Filtre de coups: ${options.minMoves ?? "?"}-${options.maxMoves ?? "?"}`, "cyan");
    }
    if (options.exactMoves !== undefined) {
      log(`📏 Nombre exact de coups: ${options.exactMoves}`, "cyan");
    }
    if (options.depth !== undefined) {
      log(`🔍 Profondeur d'analyse: ${options.depth}`, "cyan");
    }
    log("", "reset");

    // Lire le fichier PGN
    log("📖 Lecture du fichier PGN...", "blue");
    const pgnContent = readFileSync(pgnFile, "utf-8");
    log(`✅ Fichier lu (${pgnContent.length} caractères)`, "green");
    log("", "reset");

    // Initialiser le service
    log("⚙️  Initialisation du service de génération...", "blue");
    const stockfishService = getStockfishService();
    await stockfishService.initialize();
    log("✅ Stockfish initialisé", "green");
    
    const generatorService = new TacticGeneratorService(stockfishService);
    log("✅ Service de génération prêt", "green");
    log("", "reset");

    // Parser les parties PGN
    log("🔍 Parsing des parties PGN...", "blue");
    const games = generatorService.parsePGN(pgnContent);
    log(`✅ ${games.length} partie(s) parsée(s)`, "green");
    log("", "reset");

    if (games.length === 0) {
      log("❌ Aucune partie trouvée dans le fichier PGN", "red");
      process.exit(1);
    }

    // Préparer les options de génération
    const generationOptions = {
      minMoves: options.minMoves,
      maxMoves: options.maxMoves,
      exactMoves: options.exactMoves,
      depth: options.depth,
      count,
    };

    // Générer les tactiques
    log("🎲 Génération des tactiques...", "blue");
    log("⏳ Cela peut prendre du temps (analyse Stockfish)...", "yellow");
    log("", "reset");

    const stats: GenerationStats = {
      totalGenerated: 0,
      saved: 0,
      skipped: 0,
      errors: 0,
      errorMessages: [],
    };

    const tactics = await generatorService.generateTacticsFromGames(
      games,
      generationOptions
    );

    stats.totalGenerated = tactics.length;
    log(`✅ ${tactics.length} tactique(s) générée(s)`, "green");
    log("", "reset");

    // Sauvegarder chaque tactique
    log("💾 Sauvegarde dans Supabase...", "blue");
    
    for (let i = 0; i < tactics.length; i++) {
      const tactic = tactics[i];
      try {
        await generatorService.saveTactic(tactic);
        stats.saved++;
        log(
          `  ✅ [${i + 1}/${tactics.length}] Sauvegardé: ${tactic.tactic_type} (${tactic.difficulty}, ${tactic.solution_moves.length} coups)`,
          "green"
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("existe déjà")) {
          stats.skipped++;
          log(
            `  ⚠️  [${i + 1}/${tactics.length}] Ignoré (déjà existant): ${tactic.tactic_type}`,
            "yellow"
          );
        } else {
          stats.errors++;
          stats.errorMessages.push(
            `Tactique ${i + 1}: ${errorMessage}`
          );
          log(
            `  ❌ [${i + 1}/${tactics.length}] Erreur: ${errorMessage}`,
            "red"
          );
        }
      }
    }

    log("", "reset");

    // Afficher les statistiques
    displayStats(stats);

    // Terminer Stockfish
    stockfishService.terminate();
    log("✅ Génération terminée", "green");

    // Code de sortie selon les résultats
    if (stats.errors > 0) {
      process.exit(1);
    } else if (stats.saved === 0) {
      log("⚠️  Aucune tactique n'a été sauvegardée", "yellow");
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    log("", "reset");
    log("❌ Erreur fatale lors de la génération", "red");
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    log(`   ${errorMessage}`, "red");
    log("", "reset");
    
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Exécuter le script
main();

