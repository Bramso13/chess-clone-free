/**
 * Script de population de la base de données d'ouvertures
 * Charge les données depuis openings-seed.json et les insère dans Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { ChessService } from "../chess/chessService";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

// Types pour les données d'ouvertures
interface OpeningVariation {
  name: string;
  moves: string[];
}

interface OpeningData {
  name: string;
  eco_code: string;
  description: string;
  player_side: "white" | "black";
  moves: string[];
  variations: OpeningVariation[];
}

interface OpeningSeedFile {
  openings: OpeningData[];
}

/**
 * Valide une séquence de coups d'échecs
 * @param moves - Array de coups en notation algébrique
 * @param context - Contexte pour les logs (nom de l'ouverture/variante)
 * @returns true si tous les coups sont valides, false sinon
 */
export function validateOpeningMoves(
  moves: string[],
  context: string
): boolean {
  try {
    const game = ChessService.createGame();

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const validation = ChessService.validateMove(game, move);

      if (!validation.isValid) {
        console.error(
          `❌ [${context}] Coup invalide à l'index ${i}: "${move}"`,
          validation.error
        );
        return false;
      }

      // Exécuter le coup pour continuer la validation
      ChessService.makeMove(game, move);
    }

    console.log(`✅ [${context}] ${moves.length} coups validés avec succès`);
    return true;
  } catch (error) {
    console.error(
      `❌ [${context}] Erreur lors de la validation:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Valide toutes les séquences de coups d'une ouverture (ligne principale + variantes)
 * @param opening - Données de l'ouverture à valider
 * @returns true si toutes les séquences sont valides, false sinon
 */
function validateOpening(opening: OpeningData): boolean {
  console.log(`\n🔍 Validation de l'ouverture: ${opening.name}`);

  // Valider que player_side est défini
  if (!opening.player_side || (opening.player_side !== "white" && opening.player_side !== "black")) {
    console.error(
      `❌ [${opening.name}] Le champ player_side est manquant ou invalide: "${opening.player_side}"`
    );
    return false;
  }

  console.log(`✅ [${opening.name}] player_side: ${opening.player_side}`);

  // Valider la ligne principale
  const mainLineValid = validateOpeningMoves(
    opening.moves,
    `${opening.name} - Ligne principale`
  );

  if (!mainLineValid) {
    return false;
  }

  // Valider chaque variante
  for (const variation of opening.variations) {
    const variationValid = validateOpeningMoves(
      variation.moves,
      `${opening.name} - ${variation.name}`
    );

    if (!variationValid) {
      return false;
    }
  }

  return true;
}

/**
 * Charge les données d'ouvertures depuis le fichier JSON
 * @returns Données d'ouvertures parsées
 */
function loadOpeningsData(): OpeningSeedFile {
  const dataPath = path.join(
    process.cwd(),
    "data",
    "openings",
    "openings-seed.json"
  );

  console.log(`📂 Chargement des données depuis: ${dataPath}`);

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Fichier de données introuvable: ${dataPath}`);
  }

  const fileContent = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(fileContent) as OpeningSeedFile;
}

/**
 * Insère les ouvertures dans Supabase
 * @param openings - Array d'ouvertures à insérer
 */
async function seedOpenings(openings: OpeningData[]): Promise<void> {
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifiez .env.local"
    );
  }

  console.log(`\n🔗 Connexion à Supabase: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`\n📥 Insertion de ${openings.length} ouvertures dans Supabase...`);

  for (const opening of openings) {
    try {
      // Vérifier si l'ouverture existe déjà
      const { data: existingData } = await supabase
        .from("openings")
        .select("id")
        .eq("eco_code", opening.eco_code)
        .single();

      if (existingData) {
        // Mettre à jour l'ouverture existante
        const { error } = await supabase
          .from("openings")
          .update({
            name: opening.name,
            description: opening.description,
            player_side: opening.player_side,
            moves: opening.moves,
            variations: opening.variations,
          })
          .eq("eco_code", opening.eco_code);

        if (error) {
          console.error(
            `❌ Erreur lors de la mise à jour de "${opening.name}":`,
            error.message
          );
        } else {
          console.log(`✅ "${opening.name}" (${opening.eco_code}) mis à jour avec succès`);
        }
      } else {
        // Insérer une nouvelle ouverture
        const { error } = await supabase
          .from("openings")
          .insert({
            name: opening.name,
            eco_code: opening.eco_code,
            description: opening.description,
            player_side: opening.player_side,
            moves: opening.moves,
            variations: opening.variations,
          });

        if (error) {
          console.error(
            `❌ Erreur lors de l'insertion de "${opening.name}":`,
            error.message
          );
        } else {
          console.log(`✅ "${opening.name}" (${opening.eco_code}) inséré avec succès`);
        }
      }
    } catch (error) {
      console.error(
        `❌ Exception lors du traitement de "${opening.name}":`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

/**
 * Fonction principale du script de seed
 */
async function main(): Promise<void> {
  console.log("🎯 Début du processus de seed des ouvertures\n");
  console.log("=" .repeat(60));

  try {
    // 1. Charger les données
    const data = loadOpeningsData();
    console.log(`✅ ${data.openings.length} ouvertures chargées\n`);

    // 2. Valider toutes les séquences de coups
    console.log("=" .repeat(60));
    console.log("🔍 VALIDATION DES COUPS");
    console.log("=" .repeat(60));

    let allValid = true;
    for (const opening of data.openings) {
      const isValid = validateOpening(opening);
      if (!isValid) {
        allValid = false;
      }
    }

    if (!allValid) {
      console.error(
        "\n❌ Certaines séquences de coups sont invalides. Veuillez corriger les données."
      );
      process.exit(1);
    }

    console.log("\n✅ Toutes les séquences de coups sont valides!");

    // 3. Insérer dans Supabase
    console.log("\n" + "=" .repeat(60));
    console.log("💾 INSERTION DANS SUPABASE");
    console.log("=" .repeat(60));

    await seedOpenings(data.openings);

    console.log("\n" + "=" .repeat(60));
    console.log("✅ Processus de seed terminé avec succès!");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error(
      "\n❌ Erreur fatale:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

