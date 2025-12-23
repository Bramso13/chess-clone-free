/**
 * Composant FreePlayControls
 * Contrôles pour le jeu libre : annuler, nouvelle partie, orientation
 */

import { useState } from "react";
import type { GameState } from "@/lib/chess/chessService";

interface FreePlayControlsProps {
  onUndo: () => void;
  onReset: () => void;
  onOrientationChange: (orientation: "white" | "black") => void;
  canUndo: boolean;
  gameState: GameState;
  boardOrientation: "white" | "black";
}

export function FreePlayControls({
  onUndo,
  onReset,
  onOrientationChange,
  canUndo,
  gameState,
  boardOrientation,
}: FreePlayControlsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (showResetConfirm) {
      onReset();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const getGameStateMessage = (): string | null => {
    if (gameState.isCheckmate) {
      return gameState.turn === "white"
        ? "Échec et mat - Les noirs gagnent"
        : "Échec et mat - Les blancs gagnent";
    }
    if (gameState.isStalemate) {
      return "Partie nulle par pat";
    }
    if (gameState.isDraw) {
      return "Partie nulle";
    }
    if (gameState.isCheck) {
      return `Échec - C'est aux ${gameState.turn === "white" ? "blancs" : "noirs"} de jouer`;
    }
    return null;
  };

  const gameStateMessage = getGameStateMessage();
  const isGameOver = gameState.isGameOver;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
      {/* État de la partie */}
      {gameStateMessage && (
        <div
          className={`p-3 rounded-lg text-center font-medium ${
            isGameOver
              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          {gameStateMessage}
        </div>
      )}

      {/* Boutons de contrôle */}
      <div className="flex flex-wrap gap-3">
        {/* Bouton Annuler */}
        <button
          onClick={onUndo}
          disabled={!canUndo || isGameOver}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Annuler le dernier coup
        </button>

        {/* Bouton Nouvelle partie */}
        {showResetConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Confirmer
            </button>
            <button
              onClick={handleCancelReset}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Nouvelle partie
          </button>
        )}

        {/* Sélecteur d'orientation */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-medium text-gray-700">
            Orientation :
          </label>
          <select
            value={boardOrientation}
            onChange={(e) =>
              onOrientationChange(e.target.value as "white" | "black")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="white">Blancs en bas</option>
            <option value="black">Noirs en bas</option>
          </select>
        </div>
      </div>
    </div>
  );
}

