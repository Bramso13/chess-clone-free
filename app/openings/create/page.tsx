/**
 * Page de création d'ouverture personnalisée
 * Permet à l'utilisateur de créer une nouvelle ouverture en jouant des coups
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chessboard } from "@/components/chess/Chessboard";
import { CustomOpeningForm } from "@/components/openings/CustomOpeningForm";
import { StockfishSuggestion } from "@/components/freeplay/StockfishSuggestion";
import { useCustomOpeningCreation } from "@/lib/hooks/useCustomOpeningCreation";
import { useStockfishAnalysis } from "@/lib/hooks/useStockfishAnalysis";
import { createCustomOpening } from "@/lib/openings/customOpeningService";
import type { Move } from "@/types/chess";
import type { CustomOpeningFormData } from "@/components/openings/CustomOpeningForm";

export default function CreateOpeningPage() {
  const router = useRouter();
  const {
    position,
    history,
    makeMove,
    makeMoveFromUci,
    undoMove,
    resetOpening,
    canUndo,
    moveCount,
  } = useCustomOpeningCreation();

  const {
    isAnalyzing,
    analysisResult,
    error: stockfishError,
    analysisTime,
    analyzePosition,
    clearAnalysis,
  } = useStockfishAnalysis();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMove = (move: Move) => {
    makeMove(move);
    setError(null);
  };

  const handleSubmit = async (formData: CustomOpeningFormData) => {
    if (moveCount < 2) {
      setError("L'ouverture doit contenir au moins 2 coups");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Extraire les coups de l'historique
      const moves = history.map((move) => move.san);

      // Créer l'ouverture personnalisée
      await createCustomOpening({
        name: formData.name,
        eco_code: formData.eco_code,
        description: formData.description,
        moves,
        variations: [],
        player_side: formData.player_side,
      });

      // Rediriger vers la liste des ouvertures après sauvegarde
      router.push("/openings");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la sauvegarde"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    resetOpening();
    setError(null);
    clearAnalysis();
  };

  const handleAnalyze = () => {
    analyzePosition(position, 12); // Profondeur 12 pour réponse rapide
  };

  const handlePlaySuggestedMove = (uciMove: string) => {
    makeMoveFromUci(uciMove);
    clearAnalysis();
  };

  const handleDismissSuggestion = () => {
    clearAnalysis();
  };

  // Grouper les coups en paires (blanc/noir)
  const movePairs: Array<{
    white?: string;
    black?: string;
    moveNumber: number;
  }> = [];

  let moveNumber = 1;
  let currentPair: {
    white?: string;
    black?: string;
    moveNumber: number;
  } | null = null;

  history.forEach((move) => {
    if (move.color === "white") {
      if (currentPair?.black) {
        movePairs.push(currentPair);
        currentPair = {
          white: move.san,
          black: undefined,
          moveNumber: moveNumber++,
        };
      } else {
        if (!currentPair) {
          currentPair = {
            white: move.san,
            black: undefined,
            moveNumber: moveNumber++,
          };
        } else {
          currentPair.white = move.san;
        }
      }
    } else {
      if (!currentPair) {
        currentPair = {
          white: undefined,
          black: move.san,
          moveNumber: moveNumber++,
        };
      } else if (currentPair.black) {
        movePairs.push(currentPair);
        currentPair = {
          white: undefined,
          black: move.san,
          moveNumber: moveNumber++,
        };
      } else {
        currentPair.black = move.san;
      }
    }
  });

  if (currentPair) {
    movePairs.push(currentPair);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/openings"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              ← Retour à la liste des ouvertures
            </Link>
            <Link
              href="/openings/my-openings"
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
            >
              Mes ouvertures
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Créer une nouvelle ouverture
          </h1>
          <p className="mt-2 text-gray-600">
            Jouez des coups pour construire votre ouverture personnalisée
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Échiquier */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <Chessboard
                position={position}
                onMove={handleMove}
                interactive={true}
                showLegalMoves={false}
                boardOrientation="white"
              />
            </div>

            {/* Contrôles */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <div className="flex gap-3">
                <button
                  onClick={undoMove}
                  disabled={!canUndo || isSubmitting}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Annuler le dernier coup
                </button>
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Colonne droite: Formulaire et historique */}
          <div className="space-y-4">
            {/* Historique des coups */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Historique des coups
              </h3>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Aucun coup joué
                </p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {movePairs.map((pair, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 py-1 hover:bg-gray-50 rounded px-2 transition-colors"
                    >
                      <span className="text-gray-500 font-medium text-sm min-w-[2rem]">
                        {pair.moveNumber}.
                      </span>
                      {pair.white && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded font-mono text-sm bg-gray-50 text-gray-800 border border-gray-200">
                          {pair.white}
                        </div>
                      )}
                      {pair.black && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded font-mono text-sm bg-gray-100 text-gray-900 border border-gray-300">
                          {pair.black}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suggestions Stockfish */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <StockfishSuggestion
                isAnalyzing={isAnalyzing}
                analysisResult={analysisResult}
                error={stockfishError}
                analysisTime={analysisTime}
                currentPosition={position}
                onAnalyze={handleAnalyze}
                onPlaySuggestedMove={handlePlaySuggestedMove}
                onDismiss={handleDismissSuggestion}
              />
            </div>

            {/* Formulaire */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de l'ouverture
              </h3>
              <CustomOpeningForm
                onSubmit={handleSubmit}
                onReset={handleReset}
                moveCount={moveCount}
                isSubmitting={isSubmitting}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

