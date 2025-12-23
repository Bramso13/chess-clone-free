/**
 * Page Free Play - Jeu libre avec échiquier interactif
 * Permet de jouer librement des coups pour explorer des positions
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFreePlay } from "@/lib/hooks/useFreePlay";
import { useStockfishAnalysis } from "@/lib/hooks/useStockfishAnalysis";
import { FreePlayGame } from "@/components/freeplay/FreePlayGame";
import { FreePlayControls } from "@/components/freeplay/FreePlayControls";
import { FreePlayHistory } from "@/components/freeplay/FreePlayHistory";
import { StockfishSuggestion } from "@/components/freeplay/StockfishSuggestion";
import type { Move } from "@/types/chess";

export default function FreePlayPage() {
  const {
    position,
    history,
    gameState,
    makeMove,
    makeMoveFromUci,
    undoMove,
    resetGame,
    canUndo,
  } = useFreePlay();

  const {
    isAnalyzing,
    analysisResult,
    error,
    analysisTime,
    analyzePosition,
    clearAnalysis,
  } = useStockfishAnalysis();

  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white"
  );

  // Effacer l'analyse quand la position change (après un coup ou une annulation)
  useEffect(() => {
    clearAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const handleMove = (move: Move) => {
    // Si la partie est terminée, ne pas permettre de nouveaux coups
    if (gameState.isGameOver) {
      return;
    }

    makeMove(move);
  };

  const handleAnalyze = () => {
    analyzePosition(position, 12); // Profondeur 12 pour réponse rapide
  };

  const handlePlaySuggestedMove = (uciMove: string) => {
    if (gameState.isGameOver) {
      return;
    }

    makeMoveFromUci(uciMove, true);
    clearAnalysis();
  };

  const handleDismissSuggestion = () => {
    clearAnalysis();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎮 Jeu Libre</h1>
              <p className="text-gray-600 mt-1">
                Explorez librement différentes positions d'échecs
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Échiquier - Prend 2 colonnes sur 3 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6">
              <FreePlayGame
                position={position}
                onMove={handleMove}
                boardOrientation={boardOrientation}
                interactive={!gameState.isGameOver}
              />
            </div>
          </div>

          {/* Panneau latéral - Historique et contrôles */}
          <div className="space-y-6">
            {/* Suggestion Stockfish */}
            <StockfishSuggestion
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult}
              error={error}
              analysisTime={analysisTime}
              currentPosition={position}
              onAnalyze={handleAnalyze}
              onPlaySuggestedMove={handlePlaySuggestedMove}
              onDismiss={handleDismissSuggestion}
            />

            {/* Contrôles */}
            <FreePlayControls
              onUndo={undoMove}
              onReset={resetGame}
              onOrientationChange={setBoardOrientation}
              canUndo={canUndo}
              gameState={gameState}
              boardOrientation={boardOrientation}
            />

            {/* Historique */}
            <FreePlayHistory moves={history} />
          </div>
        </div>
      </main>
    </div>
  );
}
