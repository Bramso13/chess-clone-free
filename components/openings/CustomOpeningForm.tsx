/**
 * Composant CustomOpeningForm
 * Formulaire pour saisir les informations d'une ouverture personnalisée
 */

"use client";

import { useState } from "react";

export interface CustomOpeningFormData {
  name: string;
  eco_code?: string;
  description?: string;
  player_side: "white" | "black";
}

interface CustomOpeningFormProps {
  onSubmit: (data: CustomOpeningFormData) => void;
  onReset: () => void;
  moveCount: number;
  isSubmitting?: boolean;
  error?: string | null;
}

export function CustomOpeningForm({
  onSubmit,
  onReset,
  moveCount,
  isSubmitting = false,
  error,
}: CustomOpeningFormProps) {
  const [formData, setFormData] = useState<CustomOpeningFormData>({
    name: "",
    eco_code: "",
    description: "",
    player_side: "white",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setValidationError("Le nom de l'ouverture est requis");
      return;
    }

    if (moveCount < 2) {
      setValidationError("L'ouverture doit contenir au moins 2 coups");
      return;
    }

    setValidationError(null);
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      name: "",
      eco_code: "",
      description: "",
      player_side: "white",
    });
    setValidationError(null);
    onReset();
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="opening-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom de l'ouverture <span className="text-red-500">*</span>
        </label>
        <input
          id="opening-name"
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Ma défense personnalisée"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="eco-code"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Code ECO (optionnel)
        </label>
        <input
          id="eco-code"
          type="text"
          value={formData.eco_code}
          onChange={(e) =>
            setFormData({ ...formData, eco_code: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: A00"
          maxLength={10}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="player-side"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Côté du joueur <span className="text-red-500">*</span>
        </label>
        <select
          id="player-side"
          value={formData.player_side}
          onChange={(e) =>
            setFormData({
              ...formData,
              player_side: e.target.value as "white" | "black",
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={isSubmitting}
        >
          <option value="white">Blancs</option>
          <option value="black">Noirs</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optionnel)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Notes sur cette ouverture..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{displayError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || moveCount < 2}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Nouvelle ouverture
        </button>
      </div>

      {moveCount < 2 && (
        <p className="text-sm text-gray-500 text-center">
          Ajoutez au moins 2 coups avant de sauvegarder
        </p>
      )}
    </form>
  );
}

