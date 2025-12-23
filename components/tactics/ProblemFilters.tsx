/**
 * Composant de filtrage des problèmes tactiques
 * Permet de filtrer par difficulté et type de tactique
 */

"use client";

import type { TacticalDifficulty, TacticType } from "@/types/chess";

interface ProblemFiltersProps {
  selectedDifficulty: TacticalDifficulty | "all";
  selectedTacticType: TacticType | "all";
  availableTacticTypes: TacticType[];
  onDifficultyChange: (difficulty: TacticalDifficulty | "all") => void;
  onTacticTypeChange: (tacticType: TacticType | "all") => void;
  onReset: () => void;
}

/**
 * Composant ProblemFilters
 * Interface de filtrage pour les problèmes tactiques
 */
export function ProblemFilters({
  selectedDifficulty,
  selectedTacticType,
  availableTacticTypes,
  onDifficultyChange,
  onTacticTypeChange,
  onReset,
}: ProblemFiltersProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        {/* Filtre de difficulté */}
        <div className="flex-1">
          <label
            htmlFor="difficulty-filter"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Difficulté
          </label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) =>
              onDifficultyChange(e.target.value as TacticalDifficulty | "all")
            }
            className="
              w-full px-4 py-2 rounded-lg border-2 border-gray-300
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
              bg-white text-gray-900 font-medium
              transition-colors duration-200
            "
          >
            <option value="all">Toutes les difficultés</option>
            <option value="Facile">Facile</option>
            <option value="Moyen">Moyen</option>
            <option value="Difficile">Difficile</option>
          </select>
        </div>

        {/* Filtre de type de tactique */}
        <div className="flex-1">
          <label
            htmlFor="tactic-type-filter"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Type de tactique
          </label>
          <select
            id="tactic-type-filter"
            value={selectedTacticType}
            onChange={(e) =>
              onTacticTypeChange(e.target.value as TacticType | "all")
            }
            className="
              w-full px-4 py-2 rounded-lg border-2 border-gray-300
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
              bg-white text-gray-900 font-medium
              transition-colors duration-200
            "
          >
            <option value="all">Tous les types</option>
            {availableTacticTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton Réinitialiser */}
        <div className="md:w-auto">
          <button
            onClick={onReset}
            className="
              w-full md:w-auto px-6 py-2 rounded-lg
              bg-gray-100 hover:bg-gray-200
              text-gray-700 font-semibold
              border-2 border-gray-300
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Indicateur de filtrage actif */}
      {(selectedDifficulty !== "all" || selectedTacticType !== "all") && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Filtres actifs:</span>
            {selectedDifficulty !== "all" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {selectedDifficulty}
              </span>
            )}
            {selectedTacticType !== "all" && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {selectedTacticType}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

