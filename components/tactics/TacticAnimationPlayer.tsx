/**
 * Composant d'animation de tactique
 * Affiche une animation automatique de la solution d'une tactique avec contrôles de lecture
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";

interface TacticAnimationPlayerProps {
  /** Position initiale en notation FEN */
  initialPosition: string;
  /** Séquence de coups solution en notation SAN */
  solutionMoves: string[];
  /** Vitesse d'animation en millisecondes (défaut: 1000) */
  animationSpeed?: number;
  /** Démarrer l'animation automatiquement (défaut: false) */
  autoPlay?: boolean;
}

type AnimationSpeed = "slow" | "normal" | "fast";

const SPEED_MAP: Record<AnimationSpeed, number> = {
  slow: 2000,
  normal: 1000,
  fast: 500,
};

/**
 * Composant TacticAnimationPlayer
 */
export function TacticAnimationPlayer({
  initialPosition,
  solutionMoves,
  animationSpeed = 1000,
  autoPlay = false,
}: TacticAnimationPlayerProps) {
  const [currentPosition, setCurrentPosition] = useState<string>(initialPosition);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const [highlightedSquare, setHighlightedSquare] = useState<string | null>(null);
  
  const chessRef = useRef<Chess>(new Chess(initialPosition));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Réinitialiser le jeu quand la position initiale change
  useEffect(() => {
    chessRef.current = new Chess(initialPosition);
    setCurrentPosition(initialPosition);
    setCurrentMoveIndex(-1);
    setHighlightedSquare(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, [initialPosition]);

  // Gérer l'animation automatique
  useEffect(() => {
    if (!isPlaying || currentMoveIndex >= solutionMoves.length - 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (currentMoveIndex >= solutionMoves.length - 1) {
        setIsPlaying(false);
      }
      return;
    }

    const currentSpeed = typeof speed === "string" ? SPEED_MAP[speed] : animationSpeed;
    
    intervalRef.current = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        const nextIndex = prev + 1;
        
        if (nextIndex >= solutionMoves.length) {
          setIsPlaying(false);
          return prev;
        }

        // Jouer le coup suivant
        try {
          const move = chessRef.current.move(solutionMoves[nextIndex]);
          if (move) {
            setCurrentPosition(chessRef.current.fen());
            
            // Mettre en surbrillance la case de destination
            setHighlightedSquare(move.to);
            setTimeout(() => setHighlightedSquare(null), currentSpeed * 0.3);
            
            return nextIndex;
          }
        } catch (error) {
          console.error("Erreur lors de la lecture du coup:", error);
          setIsPlaying(false);
        }
        
        return prev;
      });
    }, currentSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentMoveIndex, solutionMoves, speed, animationSpeed]);

  // Réinitialiser à la position initiale
  const reset = useCallback(() => {
    chessRef.current = new Chess(initialPosition);
    setCurrentPosition(initialPosition);
    setCurrentMoveIndex(-1);
    setHighlightedSquare(null);
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [initialPosition]);

  // Aller au coup précédent
  const goToPrevious = useCallback(() => {
    if (currentMoveIndex < 0) return;
    
    setIsPlaying(false);
    chessRef.current = new Chess(initialPosition);
    
    for (let i = 0; i < currentMoveIndex; i++) {
      chessRef.current.move(solutionMoves[i]);
    }
    
    setCurrentPosition(chessRef.current.fen());
    setCurrentMoveIndex(currentMoveIndex - 1);
    setHighlightedSquare(null);
  }, [currentMoveIndex, initialPosition, solutionMoves]);

  // Aller au coup suivant
  const goToNext = useCallback(() => {
    if (currentMoveIndex >= solutionMoves.length - 1) return;
    
    setIsPlaying(false);
    const nextIndex = currentMoveIndex + 1;
    
    try {
      const move = chessRef.current.move(solutionMoves[nextIndex]);
      if (move) {
        setCurrentPosition(chessRef.current.fen());
        setCurrentMoveIndex(nextIndex);
        setHighlightedSquare(move.to);
        setTimeout(() => setHighlightedSquare(null), 300);
      }
    } catch (error) {
      console.error("Erreur lors du coup suivant:", error);
    }
  }, [currentMoveIndex, solutionMoves]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (currentMoveIndex >= solutionMoves.length - 1) {
      reset();
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentMoveIndex, solutionMoves.length, reset]);

  // Changer la vitesse
  const changeSpeed = useCallback((newSpeed: AnimationSpeed) => {
    setSpeed(newSpeed);
  }, []);

  // Déterminer l'orientation de l'échiquier
  const fenParts = initialPosition.split(" ");
  const boardOrientation = fenParts[1] === "w" ? "white" : "black";

  // Calculer la position de la case surlignée
  const getSquarePosition = (square: string): { top: string; left: string } | null => {
    if (!highlightedSquare) return null;
    
    // Calcul approximatif basé sur la notation algébrique
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.
    
    const isFlipped = boardOrientation === "black";
    const displayFile = isFlipped ? 7 - file : file;
    const displayRank = isFlipped ? 7 - rank : rank;
    
    const squareSize = 12.5; // 100% / 8 = 12.5%
    return {
      top: `${displayRank * squareSize}%`,
      left: `${displayFile * squareSize}%`,
    };
  };

  const squarePos = getSquarePosition(highlightedSquare || "");

  return (
    <div className="space-y-4">
      {/* Échiquier */}
      <div className="relative" style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <Chessboard
          position={currentPosition}
          interactive={false}
          boardOrientation={boardOrientation}
        />
        {highlightedSquare && squarePos && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              top: squarePos.top,
              left: squarePos.left,
              width: "12.5%",
              height: "12.5%",
              backgroundColor: "rgba(255, 255, 0, 0.4)",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
          />
        )}
      </div>

      {/* Contrôles */}
      <div className="flex flex-col items-center gap-4">
        {/* Contrôles principaux */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            aria-label="Retour au début"
          >
            ⏮
          </button>
          <button
            onClick={goToPrevious}
            disabled={currentMoveIndex < 0}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Coup précédent"
          >
            ⏪
          </button>
          <button
            onClick={togglePlayPause}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={goToNext}
            disabled={currentMoveIndex >= solutionMoves.length - 1}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Coup suivant"
          >
            ⏩
          </button>
        </div>

        {/* Contrôles de vitesse */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Vitesse:</span>
          <button
            onClick={() => changeSpeed("slow")}
            className={`px-3 py-1 text-sm rounded ${
              speed === "slow"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Lent
          </button>
          <button
            onClick={() => changeSpeed("normal")}
            className={`px-3 py-1 text-sm rounded ${
              speed === "normal"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => changeSpeed("fast")}
            className={`px-3 py-1 text-sm rounded ${
              speed === "fast"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Rapide
          </button>
        </div>

        {/* Indicateur de progression */}
        <div className="text-sm text-gray-600">
          Coup {currentMoveIndex + 1} / {solutionMoves.length}
          {currentMoveIndex >= 0 && (
            <span className="ml-2">
              ({solutionMoves[currentMoveIndex]})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

