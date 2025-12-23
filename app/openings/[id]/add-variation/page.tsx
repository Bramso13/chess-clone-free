/**
 * Page d'ajout de variante à une ouverture existante
 * Permet de créer une variante personnalisée pour une ouverture
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Chessboard } from "@/components/chess/Chessboard";
import { StockfishSuggestion } from "@/components/freeplay/StockfishSuggestion";
import { useVariationCreation } from "@/lib/hooks/useVariationCreation";
import { useStockfishAnalysis } from "@/lib/hooks/useStockfishAnalysis";
import { getOpeningById } from "@/lib/services/openingsService";
import { addVariationToOpening } from "@/lib/openings/customOpeningService";
import type { OpeningVariation } from "@/types/chess";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Move } from "@/types/chess";
import type { Opening } from "@/types/chess";

export default function AddVariationPage() {
  const router = useRouter();
  const params = useParams();
  const openingId = params.id as string;

  const [opening, setOpening] = useState<Opening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variationName, setVariationName] = useState("");
  const [variationDescription, setVariationDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    currentPosition,
    mainLineMoves,
    variationMoves,
    variationStartIndex,
    playMainLineMove,
    playVariationMove,
    setVariationStartPoint,
    resetVariation,
    resetToStart,
    canCreateVariation,
    isInMainLine,
    isInVariation,
  } = useVariationCreation(opening);

  const {
    isAnalyzing,
    analysisResult,
    error: stockfishError,
    analysisTime,
    analyzePosition,
    clearAnalysis,
  } = useStockfishAnalysis();

  useEffect(() => {
    const loadOpening = async () => {
      try {
        setIsLoading(true);
        const data = await getOpeningById(openingId);
        setOpening(data);
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

  const handleMove = (move: Move) => {
    if (isInMainLine) {
      // En mode ligne principale, on ne permet pas de jouer manuellement
      // L'utilisateur doit utiliser les boutons pour naviguer
      return;
    } else {
      // Création de la variante
      playVariationMove(move);
    }
  };

  const handleSubmit = async () => {
    if (!variationName.trim()) {
      setError("Le nom de la variante est requis");
      return;
    }

    if (!canCreateVariation) {
      setError("La variante doit contenir au moins 1 coup différent");
      return;
    }

    if (!opening || variationStartIndex === null) {
      setError("Erreur: position de départ de variante invalide");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Construire la variante complète : coups du début jusqu'au point de départ + coups de la variante
      // Les coups de la ligne principale jusqu'à variationStartIndex (inclus)
      const mainLineUpToStart = mainLineMoves.slice(0, variationStartIndex + 1);
      // La variante complète = coups du début + coups de la variante
      const completeVariationMoves = [...mainLineUpToStart, ...variationMoves];

      // Construire la nouvelle variante
      const newVariation: OpeningVariation = {
        name: variationName.trim(),
        moves: completeVariationMoves,
      };

      console.log("📝 Variante complète:", {
        mainLineUpToStart,
        variationMoves,
        completeVariationMoves,
      });

      // Ajouter la variante à l'ouverture (fonctionne pour toutes les ouvertures)
      const updatedOpening = await addVariationToOpening(
        opening.id,
        newVariation
      );

      console.log(
        "✅ Variante sauvegardée:",
        updatedOpening.variations?.length || 0,
        "variations"
      );

      // Rediriger vers la page d'entraînement avec rechargement forcé
      router.push(`/openings/${opening.id}`);
      router.refresh(); // Forcer le rechargement des données
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

  const handleAnalyze = () => {
    analyzePosition(currentPosition, 12);
  };

  const handlePlaySuggestedMove = (uciMove: string) => {
    if (uciMove.length >= 4) {
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion =
        uciMove.length > 4 ? (uciMove[4] as "q" | "r" | "b" | "n") : undefined;
      playVariationMove({
        from: from as any,
        to: to as any,
        promotion,
      });
    }
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
              href={`/openings/${openingId}`}
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              ← Retour à l'ouverture
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <Link
            href={`/openings/${openingId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour à l'ouverture
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Ajouter une variante à {opening?.name || "l'ouverture"}
          </h1>
          <p className="mt-2 text-gray-600">
            Naviguez dans l'ouverture principale, puis créez votre variante
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
                position={currentPosition}
                onMove={handleMove}
                interactive={!isInMainLine}
                showLegalMoves={false}
                boardOrientation="white"
              />
            </div>

            {/* Contrôles */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={resetToStart}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Retour au début
                </button>
                {isInVariation && (
                  <button
                    onClick={resetVariation}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    Réinitialiser la variante
                  </button>
                )}
              </div>

              {/* Indicateur de mode */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {isInMainLine ? (
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Mode: Navigation dans la ligne principale
                    </p>
                    <button
                      onClick={setVariationStartPoint}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Créer variante ici
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Mode: Création de variante
                    </p>
                    <p className="text-xs text-gray-600">
                      {variationMoves.length} coup(s) dans la variante
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite: Informations et formulaire */}
          <div className="space-y-4">
            {/* Ligne principale */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Ligne principale
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {mainLineMoves.map((move, index) => (
                  <button
                    key={index}
                    onClick={() => playMainLineMove(index)}
                    disabled={!isInMainLine || isSubmitting}
                    className={`w-full text-left px-2 py-1 rounded text-sm ${
                      variationStartIndex === index
                        ? "bg-green-100 border border-green-300"
                        : "hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {index + 1}. {move}
                  </button>
                ))}
              </div>
            </div>

            {/* Variante */}
            {isInVariation && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Variante en cours
                </h3>
                {variationMoves.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Aucun coup dans la variante
                  </p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {variationMoves.map((move, index) => (
                      <div
                        key={index}
                        className="px-2 py-1 rounded text-sm bg-green-50 border border-green-200"
                      >
                        {index + 1}. {move}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions Stockfish */}
            {isInVariation && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <StockfishSuggestion
                  isAnalyzing={isAnalyzing}
                  analysisResult={analysisResult}
                  error={stockfishError}
                  analysisTime={analysisTime}
                  currentPosition={currentPosition}
                  onAnalyze={handleAnalyze}
                  onPlaySuggestedMove={handlePlaySuggestedMove}
                  onDismiss={handleDismissSuggestion}
                />
              </div>
            )}

            {/* Formulaire de variante */}
            {isInVariation && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations de la variante
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="variation-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom de la variante <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="variation-name"
                      type="text"
                      value={variationName}
                      onChange={(e) => setVariationName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Variante principale"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="variation-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description (optionnel)
                    </label>
                    <textarea
                      id="variation-description"
                      value={variationDescription}
                      onChange={(e) => setVariationDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Notes sur cette variante..."
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={
                      !canCreateVariation ||
                      !variationName.trim() ||
                      isSubmitting
                    }
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sauvegarde..." : "Sauvegarder la variante"}
                  </button>

                  {!canCreateVariation && variationMoves.length > 0 && (
                    <p className="text-sm text-gray-500 text-center">
                      La variante doit contenir au moins 1 coup différent de la
                      ligne principale
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
