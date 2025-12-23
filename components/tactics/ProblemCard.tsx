/**
 * Composant carte de problème tactique
 * Affiche un aperçu d'un problème tactique avec ses informations clés
 */

"use client";

import { useRouter } from "next/navigation";
import type { TacticalProblem } from "@/types/chess";

interface ProblemCardProps {
  problem: TacticalProblem;
}

/**
 * Couleurs des badges de difficulté selon le niveau
 */
const difficultyColors = {
  Facile: "bg-green-100 text-green-800 border-green-200",
  Moyen: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Difficile: "bg-red-100 text-red-800 border-red-200",
};

/**
 * Composant ProblemCard
 * Affiche une carte cliquable avec les informations d'un problème tactique
 */
export function ProblemCard({ problem }: ProblemCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/tactics/${problem.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="
        bg-white rounded-lg border-2 border-gray-200 
        p-4 cursor-pointer transition-all duration-200
        hover:border-blue-400 hover:shadow-lg hover:-translate-y-1
      "
      data-testid="problem-card"
    >
      {/* En-tête avec difficulté */}
      <div className="flex justify-between items-start mb-3">
        <span
          className={`
            px-3 py-1 rounded-full text-sm font-semibold border-2
            ${difficultyColors[problem.difficulty]}
          `}
        >
          {problem.difficulty}
        </span>
        <span className="text-gray-500 text-sm">
          {problem.solution_moves.length} coup{problem.solution_moves.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Placeholder pour l'échiquier (à implémenter plus tard) */}
      <div className="
        bg-gradient-to-br from-gray-100 to-gray-200 
        rounded-lg h-40 mb-3 flex items-center justify-center
        border-2 border-gray-300
      ">
        <div className="text-center text-gray-600">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs font-medium">Position tactique</p>
        </div>
      </div>

      {/* Type de tactique */}
      <div className="mb-2">
        <span className="
          inline-block bg-blue-50 text-blue-700 px-3 py-1 
          rounded-md text-sm font-medium border border-blue-200
        ">
          {problem.tactic_type}
        </span>
      </div>

      {/* Explication (tronquée) */}
      <p className="text-gray-700 text-sm line-clamp-2">
        {problem.explanation}
      </p>

      {/* Indicateur d'action */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className="text-blue-600 text-sm font-medium flex items-center">
          Résoudre le problème
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

