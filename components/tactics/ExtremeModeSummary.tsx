/**
 * Composant de récapitulatif pour le mode Extreme
 * Affiche les statistiques finales de la session
 */

"use client";

import type { ExtremeModeStats } from "@/lib/hooks/useExtremeMode";

interface ExtremeModeSummaryProps {
  /** Statistiques de la session */
  stats: ExtremeModeStats;
  /** Callback appelé pour recommencer avec les mêmes filtres */
  onRestart?: () => void;
  /** Callback appelé pour retourner à la configuration */
  onBack?: () => void;
}

/**
 * Formatage du temps en minutes:secondes
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formatage du temps moyen
 */
function formatAverageTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}

/**
 * Composant ExtremeModeSummary
 */
export function ExtremeModeSummary({
  stats,
  onRestart,
  onBack,
}: ExtremeModeSummaryProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg border-2 border-gray-200 p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Session terminée
        </h1>
        <p className="text-gray-600">
          Voici vos statistiques de la session
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Problèmes tentés */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
          <div className="text-sm text-blue-600 mb-1">Tentés</div>
          <div className="text-3xl font-bold text-blue-800">
            {stats.attempted}
          </div>
        </div>

        {/* Problèmes résolus */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <div className="text-sm text-green-600 mb-1">Résolus</div>
          <div className="text-3xl font-bold text-green-800">
            {stats.solved}
          </div>
        </div>

        {/* Problèmes échoués */}
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <div className="text-sm text-red-600 mb-1">Échoués</div>
          <div className="text-3xl font-bold text-red-800">
            {stats.failed}
          </div>
        </div>

        {/* Taux de réussite */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 text-center">
          <div className="text-sm text-purple-600 mb-1">Réussite</div>
          <div className="text-3xl font-bold text-purple-800">
            {Math.round(stats.successRate)}%
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="space-y-4 mb-8">
        {/* Temps total */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <span className="text-gray-700 font-semibold">Temps total</span>
          <span className="text-gray-900 font-bold text-lg">
            {formatTime(stats.totalTimeMs)}
          </span>
        </div>

        {/* Temps moyen par problème */}
        {stats.solved > 0 && (
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-semibold">
              Temps moyen par problème résolu
            </span>
            <span className="text-gray-900 font-bold text-lg">
              {formatAverageTime(stats.averageTimePerProblem)}
            </span>
          </div>
        )}
      </div>

      {/* Message de félicitations */}
      {stats.successRate >= 80 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
          <p className="text-green-800 font-semibold">
            🎉 Excellent travail ! Vous avez un taux de réussite impressionnant !
          </p>
        </div>
      )}

      {stats.successRate >= 50 && stats.successRate < 80 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <p className="text-blue-800 font-semibold">
            👍 Bon travail ! Continuez à vous entraîner pour améliorer encore plus !
          </p>
        </div>
      )}

      {stats.successRate < 50 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
          <p className="text-yellow-800 font-semibold">
            💪 Continuez à vous entraîner ! La pratique rend parfait !
          </p>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-4">
        {onRestart && (
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Recommencer
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Retour
          </button>
        )}
      </div>
    </div>
  );
}

