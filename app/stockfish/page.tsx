/**
 * Module Stockfish - Page de configuration
 * Permet à l'utilisateur de configurer une partie contre Stockfish
 */

import { GameConfiguration } from "@/components/stockfish/GameConfiguration";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jouer contre Stockfish | Chess Training App",
  description:
    "Configurez votre partie contre Stockfish. Choisissez votre niveau de difficulté et votre couleur pour commencer l'entraînement.",
};

export default function StockfishPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🤖 Configuration de partie
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GameConfiguration />
      </main>
    </div>
  );
}

