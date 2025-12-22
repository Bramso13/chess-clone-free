/**
 * Composant OpeningList
 * Affiche une grille responsive de cartes d'ouvertures
 */

import type { Opening } from "@/types/chess";
import { OpeningCard } from "./OpeningCard";

interface OpeningListProps {
  openings: Opening[];
}

export function OpeningList({ openings }: OpeningListProps) {
  if (openings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Aucune ouverture disponible
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Les ouvertures seront bientôt disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label="Liste des ouvertures d'échecs"
    >
      {openings.map((opening) => (
        <div key={opening.id} role="listitem">
          <OpeningCard opening={opening} />
        </div>
      ))}
    </div>
  );
}

