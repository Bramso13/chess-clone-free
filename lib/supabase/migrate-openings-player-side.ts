/**
 * Script de migration pour ajouter player_side aux ouvertures existantes
 * Détecte automatiquement le player_side basé sur le premier coup
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/**
 * Détecte le côté du joueur basé sur le premier coup d'une ouverture
 * @param moves - Array de coups en notation algébrique
 * @returns 'white' si l'ouverture est pour les blancs, 'black' pour les noirs
 */
function detectPlayerSide(moves: string[]): "white" | "black" {
  if (!moves || moves.length === 0) {
    console.warn("⚠️  Aucun coup fourni, player_side par défaut: 'white'");
    return "white";
  }

  const firstMove = moves[0];
  
  // Les coups blancs typiques (coups d'ouverture courants pour les blancs)
  const whiteOpeningMoves = ["e4", "d4", "Nf3", "c4", "g3", "b3", "f4", "Nc3"];

  if (whiteOpeningMoves.includes(firstMove)) {
    return "white";
  }

  // Si le premier coup n'est pas un coup blanc typique, 
  // c'est probablement une défense (ouverture noire)
  return "black";
}

/**
 * Fonction principale du script de migration
 */
async function main(): Promise<void> {
  console.log("🎯 Début de la migration player_side\n");
  console.log("=".repeat(60));

  try {
    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Variables d'environnement Supabase manquantes. Vérifiez .env.local"
      );
    }

    console.log(`🔗 Connexion à Supabase: ${supabaseUrl}\n`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Récupérer toutes les ouvertures
    console.log("📥 Récupération des ouvertures existantes...");
    const { data: openings, error: fetchError } = await supabase
      .from("openings")
      .select("id, name, eco_code, moves, player_side");

    if (fetchError) {
      throw new Error(
        `Erreur lors de la récupération des ouvertures: ${fetchError.message}`
      );
    }

    if (!openings || openings.length === 0) {
      console.log("ℹ️  Aucune ouverture trouvée dans la base de données");
      return;
    }

    console.log(`✅ ${openings.length} ouvertures récupérées\n`);
    console.log("=".repeat(60));
    console.log("🔄 Mise à jour des player_side");
    console.log("=".repeat(60));

    let updatedCount = 0;
    let skippedCount = 0;

    for (const opening of openings) {
      // Si player_side existe déjà et est valide, on passe
      if (opening.player_side === "white" || opening.player_side === "black") {
        console.log(
          `⏭️  "${opening.name}" (${opening.eco_code}) - player_side déjà défini: ${opening.player_side}`
        );
        skippedCount++;
        continue;
      }

      // Détecter le player_side
      const detectedSide = detectPlayerSide(opening.moves as string[]);
      
      console.log(
        `🔍 "${opening.name}" (${opening.eco_code}) - Détection: ${detectedSide} (premier coup: ${opening.moves?.[0] || "N/A"})`
      );

      // Mettre à jour l'ouverture
      const { error: updateError } = await supabase
        .from("openings")
        .update({ player_side: detectedSide })
        .eq("id", opening.id);

      if (updateError) {
        console.error(
          `❌ Erreur lors de la mise à jour de "${opening.name}":`,
          updateError.message
        );
      } else {
        console.log(`✅ "${opening.name}" - player_side mis à jour: ${detectedSide}`);
        updatedCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RÉSUMÉ DE LA MIGRATION");
    console.log("=".repeat(60));
    console.log(`Total d'ouvertures: ${openings.length}`);
    console.log(`✅ Mises à jour: ${updatedCount}`);
    console.log(`⏭️  Ignorées (déjà définies): ${skippedCount}`);
    console.log("=".repeat(60));
    console.log("✅ Migration terminée avec succès!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error(
      "\n❌ Erreur fatale:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Exporter la fonction de détection pour les tests
export { detectPlayerSide };

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

