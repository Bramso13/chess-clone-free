"use client";

import type { OpeningVariation } from "@/types/chess";

interface VariationSelectorProps {
  variations: OpeningVariation[];
  currentVariationIndex: number;
  onSelectVariation: (index: number) => void;
}

/**
 * Composant pour naviguer entre les différentes variations d'une ouverture
 * - Tabs horizontaux sur desktop
 * - Dropdown sur mobile
 */
export function VariationSelector({
  variations,
  currentVariationIndex,
  onSelectVariation,
}: VariationSelectorProps) {
  if (!variations || variations.length === 0) {
    return null;
  }

  // Si une seule variation, pas besoin de sélecteur
  if (variations.length === 1) {
    return (
      <div className="mb-4 text-sm text-gray-600">
        Variante: <span className="font-semibold">{variations[0].name}</span>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Desktop - Horizontal Tabs */}
      <div className="hidden md:block">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {variations.map((variation, index) => (
            <button
              key={index}
              onClick={() => onSelectVariation(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                index === currentVariationIndex
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-current={index === currentVariationIndex ? "page" : undefined}
            >
              {variation.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile - Dropdown */}
      <div className="block md:hidden">
        <label htmlFor="variation-select" className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner une variante
        </label>
        <select
          id="variation-select"
          value={currentVariationIndex}
          onChange={(e) => onSelectVariation(Number(e.target.value))}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {variations.map((variation, index) => (
            <option key={index} value={index}>
              {variation.name}
            </option>
          ))}
        </select>
      </div>

      {/* Current variation info */}
      <div className="mt-3 text-sm text-gray-600">
        <span className="font-semibold">{variations[currentVariationIndex].name}</span>
        {" · "}
        <span>{variations[currentVariationIndex].moves.length} coups</span>
      </div>
    </div>
  );
}

