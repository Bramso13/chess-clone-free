/**
 * Composant simple pour visualiser une tactique avec navigation entre les positions
 * Affiche l'échiquier avec boutons suivant/retour pour parcourir les positions
 */

"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";

interface TacticPositionViewerProps {
  /** Position initiale en notation FEN */
  initialPosition: string;
  /** Séquence de coups solution en notation SAN */
  solutionMoves: string[];
}

/**
 * Composant TacticPositionViewer
 */
export function TacticPositionViewer({
  initialPosition,
  solutionMoves,
}: TacticPositionViewerProps) {
  const [currentPositionIndex, setCurrentPositionIndex] = useState<number>(0);
  const [positions, setPositions] = useState<string[]>([]);

  // Générer toutes les positions de la tactique
  useEffect(() => {
    const chess = new Chess(initialPosition);
    const allPositions: string[] = [initialPosition];

    for (const move of solutionMoves) {
      try {
        chess.move(move);
        allPositions.push(chess.fen());
      } catch (error) {
        console.error("Erreur lors de la génération des positions:", error);
        break;
      }
    }

    setPositions(allPositions);
    setCurrentPositionIndex(0);
  }, [initialPosition, solutionMoves]);

  const goToPrevious = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(currentPositionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentPositionIndex < positions.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1);
    }
  };

  const currentPosition = positions[currentPositionIndex] || initialPosition;

  // Déterminer l'orientation de l'échiquier
  const fenParts = initialPosition.split(" ");
  const boardOrientation = fenParts[1] === "w" ? "white" : "black";

  return (
    <div className="space-y-4">
      {/* Échiquier */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <Chessboard
          position={currentPosition}
          interactive={false}
          boardOrientation={boardOrientation}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={goToPrevious}
          disabled={currentPositionIndex === 0}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ← Retour
        </button>
        
        <span className="text-gray-700 font-medium">
          Position {currentPositionIndex + 1} / {positions.length}
          {currentPositionIndex > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({solutionMoves[currentPositionIndex - 1]})
            </span>
          )}
        </span>

        <button
          onClick={goToNext}
          disabled={currentPositionIndex >= positions.length - 1}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

