"use client";

/**
 * Composant principal de jeu contre Stockfish
 * Affiche l'échiquier, l'historique, et les contrôles de jeu
 */

import { useState } from "react";
import { Chessboard } from "@/components/chess/Chessboard";
import { MoveHistory } from "@/components/chess/MoveHistory";
import { EngineThinkingIndicator } from "./EngineThinkingIndicator";
import { useStockfishGame } from "@/lib/hooks/useStockfishGame";
import type { DifficultyLevel, Move } from "@/types/chess";
import { useRouter } from "next/navigation";

interface StockfishGameProps {
  difficulty: DifficultyLevel;
  playerColor: "white" | "black";
}

export function StockfishGame({ difficulty, playerColor }: StockfishGameProps) {
  const router = useRouter();
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  const {
    position,
    history,
    gameState,
    gameResult,
    engineThinkingTime,
    winner,
    makePlayerMove,
    undoMove,
    newGame,
    isPlayerTurn,
    canUndo,
  } = useStockfishGame({ difficulty, playerColor });

  // Convertir l'historique de strings en MoveHistoryEntry
  // Pour Stockfish, tous les coups sont valides
  const moveHistory = history.map((move, index) => ({
    move,
    valid: true,
    fen: "", // FEN non nécessaire pour l'affichage basique
  }));

  const handleMove = (move: Move) => {
    makePlayerMove(move);
  };

  const handleNewGame = () => {
    if (gameState !== "game_over" && history.length > 0) {
      setShowNewGameConfirm(true);
    } else {
      newGame();
    }
  };

  const confirmNewGame = () => {
    newGame();
    setShowNewGameConfirm(false);
  };

  const getGameOverMessage = () => {
    if (!gameResult) return null;

    if (gameResult === "checkmate_white") {
      return playerColor === "white"
        ? "🎉 Victoire ! Vous avez gagné par échec et mat !"
        : "😔 Défaite. Stockfish a gagné par échec et mat.";
    }

    if (gameResult === "checkmate_black") {
      return playerColor === "black"
        ? "🎉 Victoire ! Vous avez gagné par échec et mat !"
        : "😔 Défaite. Stockfish a gagné par échec et mat.";
    }

    if (gameResult === "stalemate") {
      return "🤝 Partie nulle par pat.";
    }

    if (gameResult === "draw") {
      return "🤝 Partie nulle.";
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Échiquier */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Chessboard
            position={position}
            onMove={handleMove}
            interactive={isPlayerTurn}
            boardOrientation={playerColor}
          />

          {/* Indicateur de tour */}
          <div className="mt-4">
            {gameState === "player_turn" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm font-medium text-green-900">
                  ✓ C'est votre tour
                </p>
              </div>
            )}

            <EngineThinkingIndicator
              thinkingTime={engineThinkingTime}
              visible={gameState === "engine_thinking"}
            />

            {gameState === "game_over" && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {getGameOverMessage()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel latéral */}
      <div className="lg:col-span-1">
        {/* Informations de partie */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Difficulté:</span>
              <span className="font-medium capitalize">{difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vous jouez:</span>
              <span className="font-medium capitalize">{playerColor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coups joués:</span>
              <span className="font-medium">
                {Math.ceil(history.length / 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Historique des coups */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historique
          </h3>
          <MoveHistory moves={moveHistory} />
        </div>

        {/* Boutons d'action */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
          <button
            onClick={undoMove}
            disabled={!canUndo}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
              canUndo
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            aria-label="Annuler le dernier coup"
          >
            ↶ Annuler le coup
          </button>

          <button
            onClick={handleNewGame}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            🔄 Nouvelle partie
          </button>

          <button
            onClick={() => router.push("/stockfish")}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            ⚙️ Changer la configuration
          </button>
        </div>
      </div>

      {/* Modal de confirmation Nouvelle partie */}
      {showNewGameConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowNewGameConfirm(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Nouvelle partie ?
            </h3>
            <p className="text-gray-600 mb-6">
              La partie en cours sera perdue. Voulez-vous vraiment recommencer ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmNewGame}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recommencer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
