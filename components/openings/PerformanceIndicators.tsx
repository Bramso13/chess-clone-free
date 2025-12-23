/**
 * Composant pour afficher les indicateurs de performance
 * Affiche le nombre de variantes, temps d'analyse, etc.
 */

"use client";

interface PerformanceIndicatorsProps {
  /** Nombre total de variantes générées */
  totalVariations: number;
  /** Temps total d'analyse en millisecondes */
  totalAnalysisTime: number;
  /** Nombre de positions analysées */
  analyzedPositions: number;
}

export function PerformanceIndicators({
  totalVariations,
  totalAnalysisTime,
  analyzedPositions,
}: PerformanceIndicatorsProps) {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Indicateurs de performance</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {totalVariations.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Variantes générées</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {formatTime(totalAnalysisTime)}
          </div>
          <div className="text-sm text-gray-600">Temps d'analyse</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {analyzedPositions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Positions analysées</div>
        </div>
      </div>
    </div>
  );
}

