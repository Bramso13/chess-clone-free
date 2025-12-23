/**
 * Composant de feedback pour la résolution de problèmes tactiques
 * Affiche les messages de succès, erreur ou félicitations
 */

"use client";

import type { TacticalProblem } from "@/types/chess";

interface SolveFeedbackProps {
  feedback: "correct" | "incorrect" | null;
  isComplete: boolean;
  problem?: TacticalProblem;
  onReset?: () => void;
}

/**
 * Composant SolveFeedback
 * Affiche le feedback selon l'état de résolution
 */
export function SolveFeedback({
  feedback,
  isComplete,
  problem,
  onReset,
}: SolveFeedbackProps) {
  // Message de félicitations quand le problème est résolu
  if (isComplete && problem) {
    return (
      <div className="
        bg-gradient-to-r from-green-50 to-emerald-50 
        rounded-lg border-2 border-green-300 p-6 mb-6
        animate-in fade-in duration-500
      ">
        <div className="flex items-start gap-4">
          {/* Icône de succès */}
          <div className="flex-shrink-0">
            <div className="
              w-12 h-12 rounded-full bg-green-500 
              flex items-center justify-center
              animate-bounce
            ">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              🎉 Bravo ! Problème résolu !
            </h3>
            <p className="text-green-800 mb-4">
              {problem.explanation}
            </p>

            {/* Bouton pour recommencer (optionnel) */}
            {onReset && (
              <button
                onClick={onReset}
                className="
                  px-4 py-2 bg-green-600 hover:bg-green-700
                  text-white font-semibold rounded-lg
                  transition-colors duration-200
                  flex items-center gap-2
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
                Recommencer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Feedback pour coup correct
  if (feedback === "correct") {
    return (
      <div className="
        bg-green-50 rounded-lg border-2 border-green-300 p-4 mb-6
        animate-in fade-in slide-in-from-bottom-4 duration-300
      ">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-green-800 font-semibold">
            Excellent coup ! Continuez...
          </span>
        </div>
      </div>
    );
  }

  // Feedback pour coup incorrect
  if (feedback === "incorrect") {
    return (
      <div className="
        bg-red-50 rounded-lg border-2 border-red-300 p-4 mb-6
        animate-in fade-in slide-in-from-bottom-4 duration-300
      ">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="text-red-800 font-semibold">
            Ce n'est pas le bon coup. Réessayez !
          </span>
        </div>
      </div>
    );
  }

  // Pas de feedback à afficher
  return null;
}

