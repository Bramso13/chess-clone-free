/**
 * Hook personnalisé pour gérer la création de variantes d'ouvertures
 * Permet de naviguer dans l'ouverture principale puis créer une variante
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import type { Move } from "@/types/chess";
import { ChessService, type GameState } from "@/lib/chess/chessService";
import type { Opening } from "@/types/chess";

export interface VariationMove {
  san: string;
  color: "white" | "black";
}

interface UseVariationCreationReturn {
  // État
  opening: Opening | null;
  currentPosition: string;
  mainLineMoves: string[];
  variationMoves: string[];
  variationStartIndex: number | null;
  gameState: GameState;

  // Actions
  playMainLineMove: (moveIndex: number) => boolean;
  playVariationMove: (move: Move) => boolean;
  setVariationStartPoint: () => void;
  resetVariation: () => void;
  resetToStart: () => void;

  // Computed
  canCreateVariation: boolean;
  isInMainLine: boolean;
  isInVariation: boolean;
}

/**
 * Hook pour la création de variantes d'ouvertures
 */
export function useVariationCreation(
  opening: Opening | null
): UseVariationCreationReturn {
  // Référence au jeu chess.js
  const gameRef = useRef<Chess>(ChessService.createGame());

  // État
  const [currentPosition, setCurrentPosition] = useState<string>(() =>
    gameRef.current.fen()
  );
  const [mainLineMoves, setMainLineMoves] = useState<string[]>([]);
  const [variationMoves, setVariationMoves] = useState<string[]>([]);
  const [variationStartIndex, setVariationStartIndex] = useState<number | null>(
    null
  );
  const [gameState, setGameState] = useState<GameState>(() =>
    ChessService.getGameState(gameRef.current)
  );

  // Initialiser avec l'ouverture
  useEffect(() => {
    if (opening && opening.moves) {
      gameRef.current = ChessService.createGame();
      setMainLineMoves(opening.moves);
      setVariationMoves([]);
      setVariationStartIndex(null);
      setCurrentPosition(gameRef.current.fen());
      setGameState(ChessService.getGameState(gameRef.current));
    }
  }, [opening]);

  /**
   * Met à jour l'état du jeu après un changement
   */
  const updateGameState = useCallback(() => {
    const newState = ChessService.getGameState(gameRef.current);
    setGameState(newState);
    setCurrentPosition(gameRef.current.fen());
  }, []);

  /**
   * Joue un coup de la ligne principale jusqu'à l'index spécifié
   * @param moveIndex - Index du coup à jouer dans la ligne principale
   * @returns true si le coup a été joué avec succès
   */
  const playMainLineMove = useCallback(
    (moveIndex: number): boolean => {
      if (!opening || !mainLineMoves.length || variationStartIndex !== null) {
        return false;
      }

      if (moveIndex < 0 || moveIndex >= mainLineMoves.length) {
        return false;
      }

      try {
        // Rejouer depuis le début jusqu'à l'index spécifié
        gameRef.current = ChessService.createGame();
        for (let i = 0; i <= moveIndex; i++) {
          const validation = ChessService.validateMove(
            gameRef.current,
            mainLineMoves[i]
          );
          if (!validation.isValid) {
            return false;
          }
          ChessService.makeMove(gameRef.current, mainLineMoves[i]);
        }

        updateGameState();
        return true;
      } catch (error) {
        console.error("Erreur lors du coup de ligne principale:", error);
        return false;
      }
    },
    [opening, mainLineMoves, variationStartIndex, updateGameState]
  );

  /**
   * Joue un coup pour créer la variante
   * @param move - Coup à jouer
   * @returns true si le coup a été joué avec succès
   */
  const playVariationMove = useCallback(
    (move: Move): boolean => {
      if (variationStartIndex === null) {
        return false;
      }

      try {
        // Valider le coup
        const validation = ChessService.validateMove(gameRef.current, move);
        if (!validation.isValid) {
          console.warn("Coup invalide:", validation.error);
          return false;
        }

        // Exécuter le coup
        ChessService.makeMove(gameRef.current, move);

        // Ajouter le coup à la variante
        const san = validation.san || move.from + move.to;
        setVariationMoves((prev) => [...prev, san]);

        // Mettre à jour l'état
        updateGameState();

        return true;
      } catch (error) {
        console.error("Erreur lors du coup de variante:", error);
        return false;
      }
    },
    [variationStartIndex, updateGameState]
  );

  /**
   * Définit le point de départ de la variante à la position actuelle
   */
  const setVariationStartPoint = useCallback(() => {
    if (!opening || !mainLineMoves.length) {
      return;
    }

    // Trouver l'index actuel dans la ligne principale
    // En comparant la position FEN actuelle avec les positions après chaque coup
    const tempGame = ChessService.createGame();
    let currentIndex = -1;

    for (let i = 0; i < mainLineMoves.length; i++) {
      ChessService.makeMove(tempGame, mainLineMoves[i]);
      if (tempGame.fen() === currentPosition) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex >= 0 && currentIndex < mainLineMoves.length - 1) {
      setVariationStartIndex(currentIndex);
      setVariationMoves([]);
    }
  }, [opening, mainLineMoves, currentPosition]);

  /**
   * Réinitialise la variante en cours
   */
  const resetVariation = useCallback(() => {
    setVariationMoves([]);
    setVariationStartIndex(null);
    // Revenir à la position de départ de la variante
    if (variationStartIndex !== null && mainLineMoves.length > 0) {
      playMainLineMove(variationStartIndex);
    }
  }, [variationStartIndex, mainLineMoves, playMainLineMove]);

  /**
   * Réinitialise à la position de départ
   */
  const resetToStart = useCallback(() => {
    gameRef.current = ChessService.createGame();
    setVariationMoves([]);
    setVariationStartIndex(null);
    updateGameState();
  }, [updateGameState]);

  const isInMainLine = variationStartIndex === null;
  const isInVariation = variationStartIndex !== null;
  const canCreateVariation =
    variationMoves.length > 0 &&
    variationStartIndex !== null &&
    variationStartIndex < mainLineMoves.length - 1;

  return {
    opening,
    currentPosition,
    mainLineMoves,
    variationMoves,
    variationStartIndex,
    gameState,
    playMainLineMove,
    playVariationMove,
    setVariationStartPoint,
    resetVariation,
    resetToStart,
    canCreateVariation,
    isInMainLine,
    isInVariation,
  };
}

