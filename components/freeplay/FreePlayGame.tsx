/**
 * Composant FreePlayGame
 * Composant principal pour le jeu libre qui intègre l'échiquier
 */

"use client";

import { Chessboard } from "@/components/chess/Chessboard";
import type { Move } from "@/types/chess";

interface FreePlayGameProps {
  position: string;
  onMove: (move: Move) => void;
  boardOrientation: "white" | "black";
  interactive?: boolean;
}

export function FreePlayGame({
  position,
  onMove,
  boardOrientation,
  interactive = true,
}: FreePlayGameProps) {
  return (
    <div className="w-full">
      <Chessboard
        position={position}
        onMove={onMove}
        interactive={interactive}
        boardOrientation={boardOrientation}
        showLegalMoves={false}
      />
    </div>
  );
}

