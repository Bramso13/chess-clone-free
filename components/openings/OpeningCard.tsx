/**
 * Composant OpeningCard
 * Affiche une carte pour une ouverture d'échecs individuelle
 */

import Link from "next/link";
import type { Opening } from "@/types/chess";

interface OpeningCardProps {
  opening: Opening;
}

export function OpeningCard({ opening }: OpeningCardProps) {
  const variationCount = opening.variations?.length || 0;
  const variationText = variationCount === 0
    ? "Aucune variante"
    : variationCount === 1
    ? "1 variante"
    : `${variationCount} variantes`;

  return (
    <Link
      href={`/openings/${opening.id}`}
      className="group block bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Pratiquer l'ouverture ${opening.name}`}
    >
      <div className="p-6">
        {/* En-tête avec nom et code ECO */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {opening.name}
          </h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ml-2 flex-shrink-0">
            {opening.eco_code}
          </span>
        </div>

        {/* Description */}
        {opening.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {opening.description}
          </p>
        )}

        {/* Statistiques */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>{opening.moves?.length || 0} coups</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>{variationText}</span>
          </div>
        </div>

        {/* Indicateur de hover */}
        <div className="mt-4 flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Commencer l'entraînement
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
        </div>
      </div>
    </Link>
  );
}

