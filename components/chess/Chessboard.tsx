"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard as ReactChessboard } from "react-chessboard";
import type { ChessboardProps, Move, Square } from "@/types/chess";
// Type pour les arguments de onPieceDrop (basé sur react-chessboard)
type PieceDropHandlerArgs = {
  piece: {
    isSparePiece: boolean;
    position: string;
    pieceType: string;
  };
  sourceSquare: string;
  targetSquare: string | null;
};

/**
 * Composant d'échiquier interactif réutilisable
 * Affiche une position FEN et gère les interactions utilisateur
 */
export function Chessboard({
  position,
  onMove,
  interactive = true,
  showLegalMoves = false,
  boardOrientation = "white",
}: ChessboardProps) {
  const [game, setGame] = useState<Chess>(() => {
    try {
      return new Chess(position);
    } catch (error) {
      // Si la position FEN est invalide, utiliser la position initiale
      console.warn("Invalid FEN position, using starting position:", error);
      return new Chess();
    }
  });

  const previousPositionRef = useRef(position);

  // Synchroniser le jeu avec la prop position seulement si elle a changé
  useEffect(() => {
    if (previousPositionRef.current !== position) {
      previousPositionRef.current = position;
      try {
        const newGame = new Chess(position);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        // Nécessaire pour synchroniser l'état interne avec la prop position externe
        setGame(newGame);
      } catch (error) {
        console.warn("Invalid FEN position, keeping current position:", error);
      }
    }
  }, [position]);

  // Calculer les coups légaux et les styles de cases si showLegalMoves est activé
  const squareStyles = useMemo(() => {
    if (!showLegalMoves) {
      return {};
    }

    const styles: Record<string, React.CSSProperties> = {};
    const legalMoves = game.moves({ verbose: true });

    legalMoves.forEach((move) => {
      styles[move.to] = {
        background:
          "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)",
        borderRadius: "50%",
      };
    });

    return styles;
  }, [game, showLegalMoves]);

  const handlePieceDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare) {
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: "q", // Promotion par défaut en dame
      });

      if (move) {
        setGame(new Chess(game.fen()));
        onMove?.({
          from: sourceSquare as Square,
          to: targetSquare as Square,
          promotion: move.promotion as Move["promotion"],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Invalid move:", error);
      return false;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="w-full aspect-square max-w-[600px] mx-auto">
        <ReactChessboard
          options={{
            position: game.fen(),
            boardOrientation,
            allowDragging: interactive,
            onPieceDrop: handlePieceDrop,
            squareStyles,
            // Optimisations pour mobile
            dragActivationDistance: 10, // Distance minimale pour activer le drag (bon pour mobile)
            allowAutoScroll: true, // Auto-scroll sur mobile lors du drag
          }}
        />
      </div>
    </div>
  );
}
