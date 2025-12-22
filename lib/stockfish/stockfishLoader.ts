/**
 * Loader pour Stockfish.js
 * Gère le chargement dynamique du moteur Stockfish
 */

import type { StockfishEngine } from "@/types/chess";

/**
 * Charge et initialise un worker Stockfish
 * Le fichier stockfish.js a été copié dans public/ pour un accès direct
 */
export async function loadStockfish(): Promise<StockfishEngine> {
  console.log("[StockfishLoader] Création du Worker depuis /stockfish.js...");

  try {
    const worker = new Worker("/stockfish.js");

    console.log("[StockfishLoader] ✅ Worker créé avec succès");

    // Ajouter un listener pour les erreurs du worker
    worker.onerror = (error) => {
      console.error("[StockfishLoader] ❌ Erreur du Worker:", error);
    };

    return worker as unknown as StockfishEngine;
  } catch (error) {
    console.error("[StockfishLoader] ❌ Échec de création du Worker:", error);
    throw error;
  }
}
