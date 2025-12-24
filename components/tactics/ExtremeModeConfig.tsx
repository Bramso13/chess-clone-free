/**
 * Composant de configuration pour le mode Extreme
 * Permet de sélectionner les filtres avant de commencer l'entraînement
 */

"use client";

import { useState, useEffect } from "react";
import type { TacticalDifficulty, TacticType } from "@/types/chess";
import type { ExtremeModeConfig } from "@/lib/hooks/useExtremeMode";
import {
  getTacticalProblemsByFilter,
  type FilterOptions,
} from "@/lib/services/tacticsService";

interface ExtremeModeConfigProps {
  /** Callback appelé quand la configuration est validée */
  onStart: (config: ExtremeModeConfig) => void;
  /** Indique si le chargement est en cours */
  isLoading?: boolean;
}

/**
 * Options de difficulté
 */
const DIFFICULTY_OPTIONS: Array<{ value: TacticalDifficulty | "all"; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "Facile", label: "Facile" },
  { value: "Moyen", label: "Moyen" },
  { value: "Difficile", label: "Difficile" },
];

/**
 * Options de source
 */
const SOURCE_OPTIONS: Array<{
  value: "all" | "manual" | "generated" | "imported";
  label: string;
}> = [
  { value: "all", label: "Tous" },
  { value: "imported", label: "Lichess uniquement" },
  { value: "manual", label: "Standard uniquement" },
];

/**
 * Composant ExtremeModeConfig
 */
export function ExtremeModeConfig({
  onStart,
  isLoading = false,
}: ExtremeModeConfigProps) {
  const [difficulty, setDifficulty] = useState<
    TacticalDifficulty | "all"
  >("all");
  const [tacticType, setTacticType] = useState<TacticType | "all">("all");
  const [source, setSource] = useState<
    "all" | "manual" | "generated" | "imported"
  >("all");
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);

  /**
   * Compter les problèmes disponibles selon les filtres
   */
  const countAvailableProblems = async () => {
    setIsCounting(true);
    try {
      const filterOptions: FilterOptions = {
        difficulty: difficulty === "all" ? undefined : difficulty,
        tacticType: tacticType === "all" ? undefined : tacticType,
        source: source === "all" ? undefined : source,
      };

      const problems = await getTacticalProblemsByFilter(filterOptions);
      setAvailableCount(problems.length);
    } catch (error) {
      console.error("Erreur lors du comptage:", error);
      setAvailableCount(null);
    } finally {
      setIsCounting(false);
    }
  };

  // Compter automatiquement quand les filtres changent
  useEffect(() => {
    countAvailableProblems();
  }, [difficulty, tacticType, source]);

  /**
   * Gérer le démarrage
   */
  const handleStart = () => {
    const config: ExtremeModeConfig = {
      difficulty: difficulty === "all" ? undefined : difficulty,
      tacticType: tacticType === "all" ? undefined : tacticType,
      source: source === "all" ? undefined : source,
      nextProblemDelayMs: 2500,
    };

    onStart(config);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border-2 border-gray-200 p-8 shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mode Extreme
        </h1>
        <p className="text-gray-600">
          Entraînez-vous intensivement avec des problèmes tactiques en série
        </p>
      </div>

      {/* Filtres */}
      <div className="space-y-6 mb-8">
        {/* Difficulté */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulté
          </label>
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as TacticalDifficulty | "all")
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type de tactique */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type de tactique
          </label>
          <select
            value={tacticType}
            onChange={(e) =>
              setTacticType(e.target.value as TacticType | "all")
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          >
            <option value="all">Tous</option>
            <option value="Fourchette">Fourchette</option>
            <option value="Clouage">Clouage</option>
            <option value="Enfilade">Enfilade</option>
            <option value="Découverte">Découverte</option>
            <option value="Mat">Mat</option>
            <option value="Gain de matériel">Gain de matériel</option>
            <option value="Double attaque">Double attaque</option>
            <option value="Sacrifice">Sacrifice</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Source
          </label>
          <select
            value={source}
            onChange={(e) =>
              setSource(
                e.target.value as "all" | "manual" | "generated" | "imported"
              )
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nombre de problèmes disponibles */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        {isCounting ? (
          <p className="text-blue-700 text-sm">Calcul en cours...</p>
        ) : availableCount !== null ? (
          <p className="text-blue-800 font-semibold">
            {availableCount} problème{availableCount > 1 ? "s" : ""} disponible
            {availableCount > 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-blue-700 text-sm">
            Cliquez sur "Vérifier" pour voir le nombre de problèmes disponibles
          </p>
        )}
      </div>

      {/* Bouton de démarrage */}
      <button
        onClick={handleStart}
        disabled={isLoading || availableCount === 0}
        className="
          w-full px-6 py-3 bg-blue-600 hover:bg-blue-700
          text-white font-bold rounded-lg
          disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors duration-200
          flex items-center justify-center gap-2
        "
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Chargement...
          </>
        ) : (
          "Commencer l'entraînement"
        )}
      </button>
    </div>
  );
}

