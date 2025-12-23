/**
 * Composant d'instructions pour un problème tactique
 * Affiche les informations clés : qui joue, difficulté, type de tactique
 */

"use client";

import type { TacticalProblem } from "@/types/chess";

interface ProblemInstructionsProps {
  problem: TacticalProblem;
  movesPlayed?: number;
  totalMoves?: number;
}

/**
 * Badge coloré selon la difficulté
 */
const difficultyColors = {
  Facile: "bg-green-100 text-green-800 border-green-300",
  Moyen: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Difficile: "bg-red-100 text-red-800 border-red-300",
};

/**
 * Composant ProblemInstructions
 * Affiche les instructions et informations du problème
 */
export function ProblemInstructions({
  problem,
  movesPlayed = 0,
  totalMoves = 0,
}: ProblemInstructionsProps) {
  // Déterminer qui joue en analysant la position FEN
  const fenParts = problem.position_fen.split(" ");
  const sideToMove = fenParts[1] === "w" ? "Blancs" : "Noirs";

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Les {sideToMove} jouent et gagnent
          </h2>
          <p className="text-gray-600">
            Trouvez la meilleure séquence de coups
          </p>
        </div>

        {/* Badges de difficulté et type */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`
              px-4 py-2 rounded-full text-sm font-semibold border-2
              ${difficultyColors[problem.difficulty]}
            `}
          >
            {problem.difficulty}
          </span>
          <span className="
            px-4 py-2 rounded-full text-sm font-semibold border-2
            bg-blue-100 text-blue-800 border-blue-300
          ">
            {problem.tactic_type}
          </span>
        </div>
      </div>

      {/* Progression */}
      {totalMoves > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progression
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {movesPlayed} / {totalMoves} coups
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(movesPlayed / totalMoves) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-gray-700">
            Cliquez sur une pièce puis sur la case de destination pour jouer votre coup.
            Tous vos coups doivent être corrects pour résoudre le problème.
          </p>
        </div>
      </div>
    </div>
  );
}

