/**
 * Composant pour afficher la liste des variantes possibles depuis une position
 * Utilisé dans la navigation par position
 */

"use client";

import type { AnalyzedVariation } from "@/types/chess";

interface VariationListProps {
  /** Variantes possibles depuis la position actuelle */
  variations: AnalyzedVariation[];
  /** Callback appelé quand une variante est sélectionnée */
  onVariationSelect: (variation: AnalyzedVariation) => void;
  /** Variante actuellement sélectionnée */
  selectedVariation?: AnalyzedVariation;
  /** Mode de tri */
  sortBy: "evaluation" | "alphabetical";
}

/**
 * Obtient la couleur selon l'évaluation
 */
function getEvaluationColor(evaluation: number): string {
  if (evaluation > 50) return "bg-green-500 text-white";
  if (evaluation > 0) return "bg-green-200";
  if (evaluation > -50) return "bg-red-200";
  return "bg-red-500 text-white";
}

export function VariationList({
  variations,
  onVariationSelect,
  selectedVariation,
  sortBy,
}: VariationListProps) {
  const sortedVariations = [...variations].sort((a, b) => {
    if (sortBy === "evaluation") {
      return b.evaluation - a.evaluation; // Meilleures d'abord
    } else {
      return (a.bestMoveSan || a.bestMove).localeCompare(
        b.bestMoveSan || b.bestMove
      );
    }
  });

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-3">Variantes possibles</h3>
      {sortedVariations.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Aucune variante disponible
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sortedVariations.map((variation, index) => {
            const isSelected = selectedVariation?.fen === variation.fen;
            const colorClass = getEvaluationColor(variation.evaluation);

            return (
              <div
                key={`${variation.fen}-${index}`}
                onClick={() => onVariationSelect(variation)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-100 border-blue-500 border-2"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">
                      {variation.bestMoveSan || variation.bestMove}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}
                    >
                      {variation.evaluation > 0 ? "+" : ""}
                      {(variation.evaluation / 100).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Profondeur: {variation.depth}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

