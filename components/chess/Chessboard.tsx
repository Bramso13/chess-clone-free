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

// Type pour les arguments de onSquareClick (basé sur react-chessboard)
type SquareClickHandlerArgs = {
  piece: {
    pieceType: string;
  } | null;
  square: string;
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

  // État pour suivre la pièce sélectionnée
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

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
        // Réinitialiser la sélection quand la position change
        setSelectedSquare(null);
      } catch (error) {
        console.warn("Invalid FEN position, keeping current position:", error);
      }
    }
  }, [position]);

  // Obtenir la couleur de la pièce sur une case
  const getPieceColor = (square: Square): "w" | "b" | null => {
    const piece = game.get(square);
    return piece ? piece.color : null;
  };

  // Obtenir les coups légaux pour une pièce spécifique
  const getLegalMovesForPiece = (square: Square): string[] => {
    return game.moves({ square, verbose: true }).map((move) => move.to);
  };

  // Calculer les coups légaux et les styles de cases
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Si une pièce est sélectionnée, afficher uniquement ses coups légaux
    if (selectedSquare) {
      // Mettre en évidence la pièce sélectionnée
      styles[selectedSquare] = {
        backgroundColor: "rgba(20, 85, 30, 0.3)",
        borderRadius: "4px",
      };

      // Afficher les coups légaux de la pièce sélectionnée
      const legalMoves = getLegalMovesForPiece(selectedSquare);
      legalMoves.forEach((targetSquare) => {
        // Vérifier si la case de destination contient une pièce
        const piece = game.get(targetSquare as Square);
        if (piece) {
          // Si c'est une prise, utiliser un style différent
          styles[targetSquare] = {
            background:
              "radial-gradient(circle, rgba(20,85,30,0.6) 36%, transparent 36%)",
            borderRadius: "50%",
            border: "3px solid rgba(20,85,30,0.8)",
          };
        } else {
          // Point pour un coup légal sur une case vide
          styles[targetSquare] = {
            background:
              "radial-gradient(circle, rgba(20,85,30,0.5) 36%, transparent 36%)",
            borderRadius: "50%",
          };
        }
      });
    }

    return styles;
  }, [game, selectedSquare]);

  // Gérer les clics sur les cases
  const handleSquareClick = ({ square }: SquareClickHandlerArgs) => {
    if (!interactive) {
      return;
    }

    const squareTyped = square as Square;
    const pieceColor = getPieceColor(squareTyped);
    const currentTurn = game.turn(); // 'w' pour blanc, 'b' pour noir

    // Si une pièce est déjà sélectionnée
    if (selectedSquare) {
      // Si on clique sur la même pièce, désélectionner
      if (squareTyped === selectedSquare) {
        setSelectedSquare(null);
        return;
      }

      // Si on clique sur une case avec un coup légal de la pièce sélectionnée
      const legalMoves = getLegalMovesForPiece(selectedSquare);
      if (legalMoves.includes(square)) {
        // Effectuer le déplacement
        try {
          const move = game.move({
            from: selectedSquare,
            to: squareTyped,
            promotion: "q", // Promotion par défaut en dame
          });

          if (move) {
            setGame(new Chess(game.fen()));
            onMove?.({
              from: selectedSquare,
              to: squareTyped,
              promotion: move.promotion as Move["promotion"],
            });
            // Réinitialiser la sélection après le déplacement
            setSelectedSquare(null);
            return;
          }
        } catch (error) {
          console.warn("Invalid move:", error);
        }
      }

      // Si on clique sur une autre pièce de la même couleur, changer la sélection
      if (pieceColor === currentTurn) {
        setSelectedSquare(squareTyped);
        return;
      }

      // Si on clique sur une case vide ou une pièce adverse, désélectionner
      setSelectedSquare(null);
      return;
    }

    // Aucune pièce sélectionnée : sélectionner si c'est une pièce du joueur actif
    if (pieceColor === currentTurn) {
      setSelectedSquare(squareTyped);
    }
  };

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
        // Réinitialiser la sélection après le déplacement
        setSelectedSquare(null);
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
            onSquareClick: interactive ? handleSquareClick : undefined,
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
