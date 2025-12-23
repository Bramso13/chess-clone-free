/**
 * Hook personnalisé pour la résolution de problèmes tactiques
 * Gère la logique de validation des coups et la progression dans la solution
 */

import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import type { TacticalProblem, Move } from "@/types/chess";
import { ChessService } from "@/lib/chess/chessService";

/**
 * État du solveur de problèmes tactiques
 */
interface TacticsSolverState {
  /** Instance Chess.js avec la position actuelle */
  game: Chess;
  /** Index du coup actuel dans la solution */
  currentMoveIndex: number;
  /** Indique si la solution complète est trouvée */
  isComplete: boolean;
  /** Feedback du dernier coup */
  lastFeedback: "correct" | "incorrect" | null;
  /** Position FEN actuelle */
  currentFen: string;
  /** Indique si c'est au tour du joueur */
  isPlayerTurn: boolean;
  /** Historique des coups joués */
  moveHistory: string[];
}

/**
 * Résultat du hook useTacticsSolver
 */
interface UseTacticsSolverResult {
  /** Position FEN actuelle */
  currentFen: string;
  /** Feedback du dernier coup */
  feedback: "correct" | "incorrect" | null;
  /** Indique si la solution est complète */
  isComplete: boolean;
  /** Indique si c'est au tour du joueur */
  isPlayerTurn: boolean;
  /** Nombre de coups joués */
  movesPlayed: number;
  /** Nombre total de coups dans la solution */
  totalMoves: number;
  /** Historique des coups */
  moveHistory: string[];
  /** Fonction pour gérer un coup du joueur */
  handleMove: (move: Move | string) => void;
  /** Fonction pour réinitialiser le problème */
  reset: () => void;
}

/**
 * Hook pour gérer la résolution d'un problème tactique
 * @param problem - Le problème tactique à résoudre
 * @returns État et fonctions pour gérer la résolution
 */
export function useTacticsSolver(problem: TacticalProblem): UseTacticsSolverResult {
  // État initial
  const [state, setState] = useState<TacticsSolverState>(() => {
    const game = ChessService.loadPosition(problem.position_fen);
    return {
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: true,
      moveHistory: [],
    };
  });

  // Réinitialiser quand le problème change
  useEffect(() => {
    const game = ChessService.loadPosition(problem.position_fen);
    setState({
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: true,
      moveHistory: [],
    });
  }, [problem.id, problem.position_fen]);

  /**
   * Jouer automatiquement le coup de l'adversaire
   */
  const playOpponentMove = useCallback((currentState: TacticsSolverState) => {
    // Vérifier s'il y a un coup adversaire à jouer
    if (currentState.currentMoveIndex >= problem.solution_moves.length) {
      return;
    }

    const opponentMove = problem.solution_moves[currentState.currentMoveIndex];
    
    // Attendre un peu avant de jouer (pour le feedback visuel)
    setTimeout(() => {
      const newGame = new Chess(currentState.game.fen());
      ChessService.makeMove(newGame, opponentMove);

      const newMoveIndex = currentState.currentMoveIndex + 1;
      const isNowComplete = newMoveIndex >= problem.solution_moves.length;

      setState({
        game: newGame,
        currentMoveIndex: newMoveIndex,
        isComplete: isNowComplete,
        lastFeedback: null, // Réinitialiser le feedback
        currentFen: newGame.fen(),
        isPlayerTurn: !isNowComplete, // Si complet, plus de tour
        moveHistory: [...currentState.moveHistory, opponentMove],
      });
    }, 800);
  }, [problem.solution_moves]);

  /**
   * Gérer un coup du joueur
   */
  const handleMove = useCallback(
    (move: Move | string) => {
      // Ne rien faire si le problème est terminé ou si ce n'est pas le tour du joueur
      if (state.isComplete || !state.isPlayerTurn) {
        return;
      }

      // Convertir le coup en notation SAN
      let sanMove: string;
      try {
        const testGame = new Chess(state.game.fen());
        const result = testGame.move(move as any);
        if (!result) {
          setState({
            ...state,
            lastFeedback: "incorrect",
          });
          return;
        }
        sanMove = result.san;
      } catch {
        setState({
          ...state,
          lastFeedback: "incorrect",
        });
        return;
      }

      // Vérifier si le coup correspond au coup attendu
      const expectedMove = problem.solution_moves[state.currentMoveIndex];

      if (sanMove === expectedMove) {
        // Coup correct !
        const newGame = new Chess(state.game.fen());
        ChessService.makeMove(newGame, sanMove);

        const newMoveIndex = state.currentMoveIndex + 1;
        const isNowComplete = newMoveIndex >= problem.solution_moves.length;

        const newState: TacticsSolverState = {
          game: newGame,
          currentMoveIndex: newMoveIndex,
          isComplete: isNowComplete,
          lastFeedback: "correct",
          currentFen: newGame.fen(),
          isPlayerTurn: false, // L'adversaire joue maintenant
          moveHistory: [...state.moveHistory, sanMove],
        };

        setState(newState);

        // Si pas terminé, jouer le coup de l'adversaire
        if (!isNowComplete) {
          playOpponentMove(newState);
        }
      } else {
        // Coup incorrect
        setState({
          ...state,
          lastFeedback: "incorrect",
        });

        // Effacer le feedback après 2 secondes
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            lastFeedback: prev.lastFeedback === "incorrect" ? null : prev.lastFeedback,
          }));
        }, 2000);
      }
    },
    [state, problem.solution_moves, playOpponentMove]
  );

  /**
   * Réinitialiser le problème
   */
  const reset = useCallback(() => {
    const game = ChessService.loadPosition(problem.position_fen);
    setState({
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: true,
      moveHistory: [],
    });
  }, [problem.position_fen]);

  return {
    currentFen: state.currentFen,
    feedback: state.lastFeedback,
    isComplete: state.isComplete,
    isPlayerTurn: state.isPlayerTurn,
    movesPlayed: state.moveHistory.length,
    totalMoves: problem.solution_moves.length,
    moveHistory: state.moveHistory,
    handleMove,
    reset,
  };
}

