/**
 * Composant liste de problèmes tactiques
 * Affiche une grille responsive de cartes de problèmes
 */

"use client";

import type { TacticalProblem } from "@/types/chess";
import { ProblemCard } from "./ProblemCard";

interface ProblemListProps {
  problems: TacticalProblem[];
  isLoading?: boolean;
}

/**
 * Composant ProblemList
 * Affiche les problèmes tactiques dans une grille responsive
 */
export function ProblemList({ problems, isLoading = false }: ProblemListProps) {
  // État de chargement
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border-2 border-gray-200 p-4 animate-pulse"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-gray-200 rounded-lg h-40 mb-3"></div>
            <div className="h-6 w-24 bg-gray-200 rounded-md mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Aucun problème disponible
  if (problems.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Aucun problème trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos filtres pour voir plus de problèmes.
        </p>
      </div>
    );
  }

  // Affichage de la grille de problèmes
  return (
    <div>
      {/* Compteur de résultats */}
      <div className="mb-4 text-sm text-gray-600">
        <span className="font-semibold">{problems.length}</span>{" "}
        problème{problems.length > 1 ? "s" : ""} trouvé{problems.length > 1 ? "s" : ""}
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {problems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
}

