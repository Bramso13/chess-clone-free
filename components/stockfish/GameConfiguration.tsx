"use client";

/**
 * Composant de configuration de partie contre Stockfish
 * Permet de sélectionner le niveau de difficulté et la couleur du joueur
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DifficultyLevel, PlayerColor } from "@/types/chess";
import { DIFFICULTY_LEVELS, COLOR_OPTIONS } from "@/lib/stockfish/constants";

export function GameConfiguration() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [playerColor, setPlayerColor] = useState<PlayerColor | "">("");
  const [error, setError] = useState<string>("");

  const handleStartGame = () => {
    // Validation
    if (!difficulty) {
      setError("Veuillez sélectionner un niveau de difficulté");
      return;
    }

    if (!playerColor) {
      setError("Veuillez sélectionner une couleur");
      return;
    }

    // Réinitialiser l'erreur
    setError("");

    // Naviguer vers la page de jeu avec les paramètres
    router.push(
      `/stockfish/game?difficulty=${difficulty}&color=${playerColor}`
    );
  };

  const isConfigurationValid = difficulty !== "" && playerColor !== "";

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Jouer contre Stockfish
        </h1>
        <p className="text-gray-600">
          Configurez votre partie en choisissant le niveau de difficulté et
          votre couleur
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Sélection du niveau de difficulté */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Niveau de difficulté
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIFFICULTY_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => {
                setDifficulty(level.id);
                setError("");
              }}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                difficulty === level.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              aria-pressed={difficulty === level.id}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{level.name}</h3>
                <span className="text-sm text-gray-500">
                  ~{level.estimatedElo}
                </span>
              </div>
              <p className="text-sm text-gray-600">{level.description}</p>
              {difficulty === level.id && (
                <div className="mt-2 flex items-center text-blue-600 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sélectionné
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Sélection de la couleur */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Votre couleur
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.id}
              onClick={() => {
                setPlayerColor(color.id as PlayerColor);
                setError("");
              }}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                playerColor === color.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              aria-pressed={playerColor === color.id}
              aria-label={`Jouer avec les ${color.name}`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                {color.name}
              </h3>
              <p className="text-sm text-gray-600">{color.description}</p>
              {playerColor === color.id && (
                <div className="mt-2 flex items-center text-blue-600 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sélectionné
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Boutons d'action */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 text-gray-700 hover:text-gray-900 hover:underline"
        >
          ← Retour à l'accueil
        </button>

        <button
          onClick={handleStartGame}
          disabled={!isConfigurationValid}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            isConfigurationValid
              ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-disabled={!isConfigurationValid}
        >
          Commencer la partie
        </button>
      </div>
    </div>
  );
}

