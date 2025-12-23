/**
 * Composant de navigation entre les problèmes tactiques
 * Permet de naviguer vers le problème précédent, suivant ou retour à la liste
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProblemNavigationProps {
  currentProblemId: string;
  previousProblemId?: string | null;
  nextProblemId?: string | null;
}

/**
 * Composant ProblemNavigation
 * Affiche les boutons de navigation entre problèmes
 */
export function ProblemNavigation({
  currentProblemId,
  previousProblemId,
  nextProblemId,
}: ProblemNavigationProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mt-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        {/* Bouton Précédent */}
        <button
          onClick={() => previousProblemId && router.push(`/tactics/${previousProblemId}`)}
          disabled={!previousProblemId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
            transition-all duration-200 w-full sm:w-auto justify-center
            ${
              previousProblemId
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

        {/* Bouton Retour à la liste */}
        <Link
          href="/tactics"
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
            bg-gray-100 hover:bg-gray-200 text-gray-700
            border-2 border-gray-300
            transition-all duration-200 w-full sm:w-auto justify-center
          "
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

        {/* Bouton Suivant */}
        <button
          onClick={() => nextProblemId && router.push(`/tactics/${nextProblemId}`)}
          disabled={!nextProblemId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
            transition-all duration-200 w-full sm:w-auto justify-center
            ${
              nextProblemId
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Suivant
          <svg
            className="w-5 h-5"
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
        </button>
      </div>
    </div>
  );
}

