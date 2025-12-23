/**
 * Page d'édition d'ouverture personnalisée
 * Permet de modifier une ouverture existante
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Chessboard } from "@/components/chess/Chessboard";
import { CustomOpeningForm } from "@/components/openings/CustomOpeningForm";
import { StockfishSuggestion } from "@/components/freeplay/StockfishSuggestion";
import { useCustomOpeningCreation } from "@/lib/hooks/useCustomOpeningCreation";
import { useStockfishAnalysis } from "@/lib/hooks/useStockfishAnalysis";
import {
  getOpeningById,
} from "@/lib/services/openingsService";
import {
  updateCustomOpening,
} from "@/lib/openings/customOpeningService";
import { ChessService } from "@/lib/chess/chessService";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Move } from "@/types/chess";
import type { CustomOpeningFormData } from "@/components/openings/CustomOpeningForm";
import type { Opening } from "@/types/chess";

export default function EditOpeningPage() {
  const router = useRouter();
  const params = useParams();
  const openingId = params.id as string;

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

  const [opening, setOpening] = useState<Opening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] =
    useState<CustomOpeningFormData | null>(null);

  useEffect(() => {
    const loadOpening = async () => {
      try {
        setIsLoading(true);
        const data = await getOpeningById(openingId);
        
        if (!data.is_custom) {
          setError("Cette ouverture ne peut pas être modifiée");
          return;
        }

        setOpening(data);
        setInitialFormData({
          name: data.name,
          eco_code: data.eco_code,
          description: data.description || "",
          player_side: data.player_side || "white",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors du chargement"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (openingId) {
      loadOpening();
    }
  }, [openingId]);

  // Charger les coups dans l'échiquier une fois l'ouverture chargée
  useEffect(() => {
    if (opening && opening.moves && opening.moves.length > 0 && history.length === 0) {
      resetOpening();
      // Rejouer les coups pour reconstruire l'historique
      const tempGame = ChessService.createGame();
      for (const move of opening.moves) {
        const moveObj = ChessService.validateMove(tempGame, move);
        if (moveObj.isValid) {
          ChessService.makeMove(tempGame, move);
          // Convertir en Move pour makeMove
          const historyMoves = ChessService.getHistory(tempGame, true);
          const lastMove = historyMoves[historyMoves.length - 1];
          makeMove({
            from: lastMove.from as any,
            to: lastMove.to as any,
            promotion: lastMove.promotion as any,
          });
        }
      }
    }
  }, [opening, resetOpening, makeMove, history.length]);

  const handleMove = (move: Move) => {
    makeMove(move);
    setError(null);
  };

  const handleSubmit = async (formData: CustomOpeningFormData) => {
    if (moveCount < 2) {
      setError("L'ouverture doit contenir au moins 2 coups");
      return;
    }

    if (!opening) {
      setError("Ouverture introuvable");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Extraire les coups de l'historique
      const moves = history.map((move) => move.san);

      // Mettre à jour l'ouverture
      await updateCustomOpening(opening.id, {
        name: formData.name,
        eco_code: formData.eco_code,
        description: formData.description,
        moves,
        player_side: formData.player_side,
      });

      // Rediriger vers la page de gestion
      router.push("/openings/my-openings");
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
    
    // Recharger les coups initiaux
    if (opening && opening.moves) {
      resetOpening();
      const tempGame = ChessService.createGame();
      for (const move of opening.moves) {
        const moveObj = ChessService.validateMove(tempGame, move);
        if (moveObj.isValid) {
          ChessService.makeMove(tempGame, move);
          const historyMoves = ChessService.getHistory(tempGame, true);
          const lastMove = historyMoves[historyMoves.length - 1];
          makeMove({
            from: lastMove.from as any,
            to: lastMove.to as any,
            promotion: lastMove.promotion as any,
          });
        }
      }
    }
  };

  const handleAnalyze = () => {
    analyzePosition(position, 12);
  };

  const handlePlaySuggestedMove = (uciMove: string) => {
    makeMoveFromUci(uciMove);
    clearAnalysis();
  };

  const handleDismissSuggestion = () => {
    clearAnalysis();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner message="Chargement de l'ouverture..." />
        </div>
      </div>
    );
  }

  if (error && !opening) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Link
              href="/openings/my-openings"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              ← Retour à mes ouvertures
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <Link
            href="/openings/my-openings"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour à mes ouvertures
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier l'ouverture
          </h1>
          <p className="mt-2 text-gray-600">
            Modifiez les coups et les informations de votre ouverture
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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
            {initialFormData && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

