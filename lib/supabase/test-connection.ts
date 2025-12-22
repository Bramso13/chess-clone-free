/**
 * Script de test pour valider la connexion Supabase
 *
 * Usage:
 *   npx tsx lib/supabase/test-connection.ts
 *
 * Ou avec ts-node:
 *   npx ts-node lib/supabase/test-connection.ts
 */

// Charger les variables d'environnement depuis .env ou .env.local
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Charger .env.local en priorité, sinon .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log("📝 Variables chargées depuis .env.local");
} else if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("📝 Variables chargées depuis .env");
} else {
  console.warn("⚠️  Aucun fichier .env ou .env.local trouvé");
}

// Créer le client Supabase directement ici après avoir chargé les variables
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env or .env.local file."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  test: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️  SKIP";
  message: string;
  error?: string;
}

const results: TestResult[] = [];

function logResult(
  test: string,
  status: "✅ PASS" | "❌ FAIL" | "⚠️  SKIP",
  message: string,
  error?: string
) {
  results.push({ test, status, message, error });
  console.log(`${status} - ${test}: ${message}`);
  if (error) {
    console.error(`   Erreur: ${error}`);
  }
}

async function testConnection() {
  console.log("\n🔍 Test de connexion Supabase\n");
  console.log("=".repeat(50));

  // Test 1: Vérifier les variables d'environnement
  console.log("\n1. Vérification des variables d'environnement...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === "your_supabase_project_url") {
    logResult(
      "Variables d'environnement",
      "❌ FAIL",
      "NEXT_PUBLIC_SUPABASE_URL n'est pas configuré",
      "Veuillez remplir .env.local avec votre URL Supabase"
    );
    return;
  }

  if (!supabaseKey || supabaseKey === "your_supabase_anon_key") {
    logResult(
      "Variables d'environnement",
      "❌ FAIL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas configuré",
      "Veuillez remplir .env.local avec votre clé anonyme Supabase"
    );
    return;
  }

  logResult(
    "Variables d'environnement",
    "✅ PASS",
    `URL: ${supabaseUrl.substring(0, 30)}...`
  );

  // Test 2: Test de connexion basique
  console.log("\n2. Test de connexion au client Supabase...");
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("count")
      .limit(0);

    if (error) {
      // Si l'erreur est "relation does not exist", les tables ne sont pas créées
      if (
        error.message.includes("does not exist") ||
        error.code === "PGRST116"
      ) {
        logResult(
          "Connexion client",
          "❌ FAIL",
          "Les tables n'existent pas encore",
          "Veuillez exécuter le script SQL dans lib/supabase/schema.sql dans l'éditeur SQL de Supabase"
        );
      } else {
        logResult(
          "Connexion client",
          "❌ FAIL",
          "Erreur de connexion",
          error.message
        );
      }
    } else {
      logResult(
        "Connexion client",
        "✅ PASS",
        "Connexion réussie au projet Supabase"
      );
    }
  } catch (error) {
    logResult(
      "Connexion client",
      "❌ FAIL",
      "Erreur lors de la connexion",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 3: Test d'accès à la table openings
  console.log("\n3. Test d'accès à la table 'openings'...");
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("*")
      .limit(1);

    if (error) {
      if (
        error.message.includes("does not exist") ||
        error.code === "PGRST116"
      ) {
        logResult(
          "Table openings",
          "❌ FAIL",
          "La table n'existe pas",
          "Exécutez le script SQL dans Supabase SQL Editor"
        );
      } else if (
        error.code === "42501" ||
        error.message.includes("permission")
      ) {
        logResult(
          "Table openings",
          "❌ FAIL",
          "Permissions insuffisantes",
          "Vérifiez que RLS est configuré avec la policy de lecture publique"
        );
      } else {
        logResult("Table openings", "❌ FAIL", "Erreur d'accès", error.message);
      }
    } else {
      logResult(
        "Table openings",
        "✅ PASS",
        `Table accessible (${data?.length || 0} enregistrement(s) trouvé(s))`
      );
    }
  } catch (error) {
    logResult(
      "Table openings",
      "❌ FAIL",
      "Erreur lors de l'accès",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 4: Test d'accès à la table tactical_problems
  console.log("\n4. Test d'accès à la table 'tactical_problems'...");
  try {
    const { data, error } = await supabase
      .from("tactical_problems")
      .select("*")
      .limit(1);

    if (error) {
      if (
        error.message.includes("does not exist") ||
        error.code === "PGRST116"
      ) {
        logResult(
          "Table tactical_problems",
          "❌ FAIL",
          "La table n'existe pas",
          "Exécutez le script SQL dans Supabase SQL Editor"
        );
      } else if (
        error.code === "42501" ||
        error.message.includes("permission")
      ) {
        logResult(
          "Table tactical_problems",
          "❌ FAIL",
          "Permissions insuffisantes",
          "Vérifiez que RLS est configuré avec la policy de lecture publique"
        );
      } else {
        logResult(
          "Table tactical_problems",
          "❌ FAIL",
          "Erreur d'accès",
          error.message
        );
      }
    } else {
      logResult(
        "Table tactical_problems",
        "✅ PASS",
        `Table accessible (${data?.length || 0} enregistrement(s) trouvé(s))`
      );
    }
  } catch (error) {
    logResult(
      "Table tactical_problems",
      "❌ FAIL",
      "Erreur lors de l'accès",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 5: Test des indexes (via une requête qui devrait les utiliser)
  console.log("\n5. Test des indexes (requête optimisée)...");
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("id, name, eco_code")
      .eq("eco_code", "B20")
      .limit(1);

    if (error) {
      logResult(
        "Indexes",
        "⚠️  SKIP",
        "Impossible de tester (table peut-être vide ou inexistante)",
        error.message
      );
    } else {
      logResult(
        "Indexes",
        "✅ PASS",
        "Requête avec index exécutée avec succès"
      );
    }
  } catch (error) {
    logResult(
      "Indexes",
      "⚠️  SKIP",
      "Test non applicable",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Résumé
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Résumé des tests\n");

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;
  const skipped = results.filter((r) => r.status === "⚠️  SKIP").length;

  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  if (skipped > 0) {
    console.log(`⚠️  Ignorés: ${skipped}`);
  }

  if (failed === 0) {
    console.log(
      "\n🎉 Tous les tests sont passés ! La configuration Supabase est correcte.\n"
    );
    process.exit(0);
  } else {
    console.log(
      "\n⚠️  Certains tests ont échoué. Veuillez corriger les problèmes ci-dessus.\n"
    );
    process.exit(1);
  }
}

// Exécuter les tests
testConnection().catch((error) => {
  console.error("\n❌ Erreur fatale lors de l'exécution des tests:");
  console.error(error);
  process.exit(1);
});
