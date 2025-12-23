/**
 * Hook personnalisé pour gérer la création d'ouvertures personnalisées
 * Permet de jouer des coups pour construire une ouverture et gérer l'état
 */

import { useState, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import type { Move } from "@/types/chess";
import { ChessService, type GameState } from "@/lib/chess/chessService";

export interface OpeningMove {
  san: string;
  color: "white" | "black";
}

interface UseCustomOpeningCreationReturn {
  // État du jeu
  position: string;
  history: OpeningMove[];
  gameState: GameState;
  fenHistory: string[]; // Historique des positions FEN pour l'annulation

  // Actions
  makeMove: (move: Move) => boolean;
  makeMoveFromUci: (uci: string) => boolean;
  undoMove: () => boolean;
  resetOpening: () => void;

  // Computed
  canUndo: boolean;
  moveCount: number;
}

/**
 * Hook pour la création d'ouvertures personnalisées
 */
export function useCustomOpeningCreation(): UseCustomOpeningCreationReturn {
  // Référence au jeu chess.js
  const gameRef = useRef<Chess>(ChessService.createGame());

  // État
  const [position, setPosition] = useState<string>(() => gameRef.current.fen());
  const [history, setHistory] = useState<OpeningMove[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>(() => [
    gameRef.current.fen(),
  ]);
  const [gameState, setGameState] = useState<GameState>(() =>
    ChessService.getGameState(gameRef.current)
  );

  /**
   * Met à jour l'état du jeu après un changement
   */
  const updateGameState = useCallback(() => {
    const newState = ChessService.getGameState(gameRef.current);
    setGameState(newState);
    setPosition(gameRef.current.fen());
  }, []);

  /**
   * Joue un coup sur l'échiquier
   * @param move - Coup à jouer
   * @returns true si le coup a été joué avec succès, false sinon
   */
  const makeMove = useCallback(
    (move: Move): boolean => {
      try {
        // Valider le coup
        const validation = ChessService.validateMove(gameRef.current, move);
        if (!validation.isValid) {
          console.warn("Coup invalide:", validation.error);
          return false;
        }

        // Si la partie est terminée, ne pas permettre de nouveaux coups
        if (gameRef.current.isGameOver()) {
          return false;
        }

        // Exécuter le coup
        ChessService.makeMove(gameRef.current, move);

        // Obtenir le coup au format SAN
        const historyMoves = ChessService.getHistory(gameRef.current, true);
        const lastMove = historyMoves[historyMoves.length - 1];

        // Déterminer la couleur du joueur qui vient de jouer (c'est l'inverse du tour actuel)
        const currentTurn = gameRef.current.turn();
        const playerColor = currentTurn === "w" ? "black" : "white";

        // Ajouter le coup à l'historique
        const moveEntry: OpeningMove = {
          san: validation.san || lastMove.san || "",
          color: playerColor,
        };

        setHistory((prev) => [...prev, moveEntry]);

        // Ajouter la nouvelle position FEN à l'historique (après le coup)
        const newFen = gameRef.current.fen();
        setFenHistory((prev) => [...prev, newFen]);

        // Mettre à jour l'état
        updateGameState();

        return true;
      } catch (error) {
        console.error("Erreur lors du coup:", error);
        return false;
      }
    },
    [updateGameState]
  );

  /**
   * Joue un coup depuis une notation UCI (utilisé pour les coups suggérés par Stockfish)
   * @param uci - Coup en format UCI (ex: "e2e4")
   * @returns true si le coup a été joué avec succès, false sinon
   */
  const makeMoveFromUci = useCallback(
    (uci: string): boolean => {
      try {
        if (uci.length < 4) {
          console.warn("Format UCI invalide:", uci);
          return false;
        }

        const from = uci.substring(0, 2);
        const to = uci.substring(2, 4);
        const promotion = uci.length > 4 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;

        const move: Move = {
          from: from as any,
          to: to as any,
          promotion,
        };

        return makeMove(move);
      } catch (error) {
        console.error("Erreur lors de la conversion UCI:", error);
        return false;
      }
    },
    [makeMove]
  );

  /**
   * Annule le dernier coup joué
   * @returns true si un coup a été annulé, false sinon
   */
  const undoMove = useCallback((): boolean => {
    // Ne peut pas annuler si aucun coup n'a été joué
    if (history.length === 0 || fenHistory.length <= 1) {
      return false;
    }

    try {
      // Restaurer la position précédente depuis l'historique FEN
      const previousFen = fenHistory[fenHistory.length - 2];
      gameRef.current = ChessService.loadPosition(previousFen);

      // Retirer le dernier coup de l'historique
      setHistory((prev) => prev.slice(0, -1));

      // Retirer la dernière position FEN de l'historique
      setFenHistory((prev) => prev.slice(0, -1));

      // Mettre à jour l'état
      updateGameState();

      return true;
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      return false;
    }
  }, [history.length, fenHistory, updateGameState]);

  /**
   * Réinitialise l'ouverture à la position initiale
   */
  const resetOpening = useCallback(() => {
    gameRef.current = ChessService.createGame();
    setHistory([]);
    setFenHistory([gameRef.current.fen()]);
    updateGameState();
  }, [updateGameState]);

  return {
    position,
    history,
    gameState,
    fenHistory,
    makeMove,
    makeMoveFromUci,
    undoMove,
    resetOpening,
    canUndo: history.length > 0,
    moveCount: history.length,
  };
}

