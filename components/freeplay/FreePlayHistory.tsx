/**
 * Composant FreePlayHistory
 * Affiche l'historique des coups avec notation algébrique et indication du joueur
 */

import type { FreePlayMove } from "@/lib/hooks/useFreePlay";

interface FreePlayHistoryProps {
  moves: FreePlayMove[];
  title?: string;
}

export function FreePlayHistory({
  moves,
  title = "Historique des coups",
}: FreePlayHistoryProps) {
  if (moves.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 text-sm text-center py-4">
          Aucun coup joué
        </p>
      </div>
    );
  }

  // Grouper les coups en paires (blanc/noir) dans l'ordre chronologique
  // Dans le free play, on peut jouer n'importe quelle couleur
  const movePairs: Array<{
    white?: FreePlayMove;
    black?: FreePlayMove;
    moveNumber: number;
  }> = [];

  let moveNumber = 1;
  let currentPair: {
    white?: FreePlayMove;
    black?: FreePlayMove;
    moveNumber: number;
  } | null = null;

  moves.forEach((move) => {
    if (move.color === "white") {
      // Si on a déjà une paire avec un noir, commencer une nouvelle paire
      if (currentPair?.black) {
        movePairs.push(currentPair);
        currentPair = {
          white: move,
          black: undefined,
          moveNumber: moveNumber++,
        };
      } else {
        // Créer une nouvelle paire ou compléter la paire actuelle
        if (!currentPair) {
          currentPair = {
            white: move,
            black: undefined,
            moveNumber: moveNumber++,
          };
        } else {
          currentPair.white = move;
        }
      }
    } else {
      // Coup noir
      if (!currentPair) {
        // Commencer une paire avec blanc vide
        currentPair = {
          white: undefined,
          black: move,
          moveNumber: moveNumber++,
        };
      } else if (currentPair.black) {
        // Déjà un noir, commencer une nouvelle paire
        movePairs.push(currentPair);
        currentPair = {
          white: undefined,
          black: move,
          moveNumber: moveNumber++,
        };
      } else {
        // Compléter la paire actuelle
        currentPair.black = move;
      }
    }
  });

  // Ajouter la dernière paire si elle existe
  if (currentPair) {
    movePairs.push(currentPair);
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {movePairs.map((pair, index) => (
          <div
            key={index}
            className="flex items-center gap-2 py-1 hover:bg-gray-50 rounded px-2 transition-colors"
          >
            {/* Numéro du coup */}
            <span className="text-gray-500 font-medium text-sm min-w-[2rem]">
              {pair.moveNumber}.
            </span>

            {/* Coup des blancs */}
            {pair.white && (
              <div className="flex items-center gap-1 px-2 py-1 rounded font-mono text-sm bg-gray-50 text-gray-800 border border-gray-200">
                <span>{pair.white.san}</span>
                {pair.white.isStockfishSuggestion && (
                  <span className="text-xs text-blue-600" title="Suggéré par Stockfish">
                    🤖
                  </span>
                )}
              </div>
            )}

            {/* Coup des noirs */}
            {pair.black && (
              <div className="flex items-center gap-1 px-2 py-1 rounded font-mono text-sm bg-gray-100 text-gray-900 border border-gray-300">
                <span>{pair.black.san}</span>
                {pair.black.isStockfishSuggestion && (
                  <span className="text-xs text-blue-600" title="Suggéré par Stockfish">
                    🤖
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

