/**
 * Composant d'actions post-résolution pour les problèmes tactiques
 * Affiche les boutons de navigation et de contrôle
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProblemActionsProps {
  /** ID du problème actuel */
  currentProblemId: string;
  /** ID du problème précédent (null si pas de précédent) */
  previousProblemId?: string | null;
  /** ID du problème suivant (null si pas de suivant) */
  nextProblemId?: string | null;
  /** Fonction pour réinitialiser le problème actuel */
  onReset: () => void;
  /** Callback optionnel pour revoir la solution */
  onReplaySolution?: () => void;
}

/**
 * Composant ProblemActions
 * Affiche les boutons d'actions après résolution
 */
export function ProblemActions({
  currentProblemId,
  previousProblemId,
  nextProblemId,
  onReset,
  onReplaySolution,
}: ProblemActionsProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mt-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        {/* Bouton Précédent */}
        <button
          onClick={() => previousProblemId && router.push(`/tactics/${previousProblemId}`)}
          disabled={!previousProblemId}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold
            transition-all duration-200 w-full sm:w-auto justify-center
            focus:ring-2 focus:ring-offset-2
            ${
              previousProblemId
                ? `
                  bg-blue-600 hover:bg-blue-700 text-white
                  hover:shadow-md focus:ring-blue-400
                `
                : `
                  bg-gray-200 text-gray-400 cursor-not-allowed
                  focus:ring-gray-400
                `
            }
          `}
          aria-label={previousProblemId ? "Retour au problème précédent" : "Pas de problème précédent"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Précédent
        </button>

        {/* Groupe de boutons centrés */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {/* Bouton Recommencer */}
        <button
          onClick={onReset}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold
            bg-gray-100 hover:bg-gray-200 text-gray-700
            border-2 border-gray-300
            transition-all duration-200 hover:shadow-md
            w-full sm:w-auto justify-center
            focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          "
          aria-label="Recommencer ce problème"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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

        {/* Bouton Retour à la liste */}
        <Link
          href="/tactics"
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold
            bg-blue-50 hover:bg-blue-100 text-blue-700
            border-2 border-blue-300
            transition-all duration-200 hover:shadow-md
            w-full sm:w-auto justify-center
            focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
          "
          aria-label="Retour à la liste des problèmes"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          Liste des problèmes
        </Link>

        {/* Bouton Revoir la solution (optionnel) */}
        {onReplaySolution && (
          <button
            onClick={onReplaySolution}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold
              bg-purple-50 hover:bg-purple-100 text-purple-700
              border-2 border-purple-300
              transition-all duration-200 hover:shadow-md
              w-full sm:w-auto justify-center
              focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
            "
            aria-label="Revoir la solution complète"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Revoir la solution
          </button>
        )}
        </div>

        {/* Bouton Problème suivant (à droite) */}
        <button
          onClick={() => nextProblemId && router.push(`/tactics/${nextProblemId}`)}
          disabled={!nextProblemId}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold
            transition-all duration-200 w-full sm:w-auto justify-center
            focus:ring-2 focus:ring-offset-2
            ${
              nextProblemId
                ? `
                  bg-blue-600 hover:bg-blue-700 text-white
                  hover:shadow-md focus:ring-blue-400
                `
                : `
                  bg-gray-200 text-gray-400 cursor-not-allowed
                  focus:ring-gray-400
                `
            }
          `}
          aria-label={nextProblemId ? "Passer au problème suivant" : "Pas de problème suivant"}
        >
          Suivant
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

