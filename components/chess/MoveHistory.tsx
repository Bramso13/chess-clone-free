/**
 * Composant MoveHistory
 * Affiche l'historique des coups avec indication visuelle des coups corrects/incorrects
 */

interface MoveHistoryEntry {
  move: string;
  valid: boolean;
  fen: string;
}

interface MoveHistoryProps {
  moves: MoveHistoryEntry[];
  title?: string;
}

export function MoveHistory({ moves, title = "Historique" }: MoveHistoryProps) {
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

  // Grouper les coups par paire (blancs et noirs)
  const movePairs: Array<{ white?: MoveHistoryEntry; black?: MoveHistoryEntry; moveNumber: number }> = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1],
      moveNumber: Math.floor(i / 2) + 1,
    });
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
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-sm ${
                  pair.white.valid
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span>{pair.white.move}</span>
                <span className="text-xs">
                  {pair.white.valid ? "✓" : "✗"}
                </span>
              </div>
            )}

            {/* Coup des noirs */}
            {pair.black && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-sm ${
                  pair.black.valid
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span>{pair.black.move}</span>
                <span className="text-xs">
                  {pair.black.valid ? "✓" : "✗"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

