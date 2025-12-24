/**
 * Hook personnalisé pour la résolution de problèmes tactiques
 * Gère la logique de validation des coups et la progression dans la solution
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
  /** Historique des états pour annulation (snapshots) */
  stateHistory: Array<{
    game: Chess;
    currentMoveIndex: number;
    currentFen: string;
    isPlayerTurn: boolean;
    moveHistory: string[];
  }>;
}

/**
 * Options pour le hook useTacticsSolver
 */
export interface UseTacticsSolverOptions {
  /** Activer l'annulation automatique des coups incorrects (défaut: true) */
  autoUndoIncorrectMoves?: boolean;
  /** Délai avant annulation automatique en millisecondes (défaut: 1250) */
  autoUndoDelayMs?: number;
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
  /** Fonction pour annuler le dernier coup */
  undoLastMove: () => void;
}

/**
 * Hook pour gérer la résolution d'un problème tactique
 * @param problem - Le problème tactique à résoudre
 * @param options - Options de configuration (annulation automatique, etc.)
 * @returns État et fonctions pour gérer la résolution
 */
export function useTacticsSolver(
  problem: TacticalProblem,
  options: UseTacticsSolverOptions = {}
): UseTacticsSolverResult {
  const { autoUndoIncorrectMoves = true, autoUndoDelayMs = 1250 } = options;

  // Référence pour stocker les timeouts d'annulation
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      stateHistory: [],
    };
  });

  // Réinitialiser quand le problème change
  useEffect(() => {
    // Nettoyer le timeout d'annulation s'il existe
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    const game = ChessService.loadPosition(problem.position_fen);
    setState({
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: true,
      moveHistory: [],
      stateHistory: [],
    });
  }, [problem.id, problem.position_fen]);

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Jouer automatiquement le coup de l'adversaire
   */
  const playOpponentMove = useCallback(
    (currentState: TacticsSolverState) => {
      // Vérifier s'il y a un coup adversaire à jouer
      if (currentState.currentMoveIndex >= problem.solution_moves.length) {
        return;
      }

      const opponentMove =
        problem.solution_moves[currentState.currentMoveIndex];

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
          stateHistory: currentState.stateHistory, // Préserver l'historique
        });
      }, 800);
    },
    [problem.solution_moves]
  );

  /**
   * Annuler le dernier coup joué
   */
  const undoLastMove = useCallback(() => {
    setState((prev) => {
      // Si pas d'historique, ne rien faire
      if (prev.stateHistory.length === 0) {
        return prev;
      }

      // Restaurer l'état précédent
      const previousState = prev.stateHistory[prev.stateHistory.length - 1];
      const restoredGame = ChessService.loadPosition(previousState.currentFen);

      return {
        game: restoredGame,
        currentMoveIndex: previousState.currentMoveIndex,
        isComplete: false,
        lastFeedback: null,
        currentFen: previousState.currentFen,
        isPlayerTurn: previousState.isPlayerTurn,
        moveHistory: previousState.moveHistory,
        stateHistory: prev.stateHistory.slice(0, -1),
      };
    });
  }, []);

  /**
   * Sauvegarder un snapshot de l'état actuel
   */
  const saveStateSnapshot = useCallback((currentState: TacticsSolverState) => {
    return {
      game: new Chess(currentState.game.fen()),
      currentMoveIndex: currentState.currentMoveIndex,
      currentFen: currentState.currentFen,
      isPlayerTurn: currentState.isPlayerTurn,
      moveHistory: [...currentState.moveHistory],
    };
  }, []);

  /**
   * Gérer un coup du joueur
   */
  const handleMove = useCallback(
    (move: Move | string) => {
      // Annuler le timeout d'annulation précédent s'il existe
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }

      // Ne rien faire si le problème est terminé ou si ce n'est pas le tour du joueur
      if (state.isComplete || !state.isPlayerTurn) {
        return;
      }

      // Sauvegarder l'état actuel avant de jouer le coup (pour annulation)
      const stateSnapshot = saveStateSnapshot(state);

      // Convertir le coup en notation SAN
      let sanMove: string | null = null;
      let isInvalidMove = false;
      try {
        const testGame = new Chess(state.game.fen());
        const result = testGame.move(move as any);
        if (!result) {
          isInvalidMove = true;
        } else {
          sanMove = result.san;
        }
      } catch {
        isInvalidMove = true;
      }

      // Coup invalide technique (illégal)
      if (isInvalidMove || !sanMove) {
        setState({
          ...state,
          lastFeedback: "incorrect",
        });

        // Pour les coups invalides techniques, annulation immédiate si activée
        if (autoUndoIncorrectMoves) {
          // Pas besoin de délai pour les coups invalides techniques
          // Le coup n'a pas été joué, donc pas besoin d'annuler
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              lastFeedback:
                prev.lastFeedback === "incorrect" ? null : prev.lastFeedback,
            }));
          }, 1000);
        } else {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              lastFeedback:
                prev.lastFeedback === "incorrect" ? null : prev.lastFeedback,
            }));
          }, 2000);
        }
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
          stateHistory: [], // Réinitialiser l'historique après un coup correct (on ne peut pas annuler un coup correct)
        };

        setState(newState);

        // Si pas terminé, jouer le coup de l'adversaire
        if (!isNowComplete) {
          playOpponentMove(newState);
        }
      } else {
        // Coup incorrect tactiquement (légal mais pas la solution)
        // Jouer le coup pour l'afficher, puis annuler
        const newGame = new Chess(state.game.fen());
        ChessService.makeMove(newGame, sanMove);

        const newState: TacticsSolverState = {
          ...state,
          game: newGame,
          currentFen: newGame.fen(),
          lastFeedback: "incorrect",
          stateHistory: [...state.stateHistory, stateSnapshot], // Sauvegarder l'état avant le coup incorrect
        };

        setState(newState);

        // Annulation automatique après délai si activée
        if (autoUndoIncorrectMoves && !state.isComplete) {
          undoTimeoutRef.current = setTimeout(() => {
            setState((prev) => {
              // Restaurer l'état depuis l'historique
              if (prev.stateHistory.length === 0) {
                return { ...prev, lastFeedback: null };
              }

              const previousState =
                prev.stateHistory[prev.stateHistory.length - 1];
              const restoredGame = ChessService.loadPosition(
                previousState.currentFen
              );

              return {
                game: restoredGame,
                currentMoveIndex: previousState.currentMoveIndex,
                isComplete: false,
                lastFeedback: null,
                currentFen: previousState.currentFen,
                isPlayerTurn: previousState.isPlayerTurn,
                moveHistory: previousState.moveHistory,
                stateHistory: prev.stateHistory.slice(0, -1),
              };
            });
          }, autoUndoDelayMs);
        } else {
          // Effacer le feedback après 2 secondes si annulation désactivée
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              lastFeedback:
                prev.lastFeedback === "incorrect" ? null : prev.lastFeedback,
            }));
          }, 2000);
        }
      }
    },
    [
      state,
      problem.solution_moves,
      playOpponentMove,
      autoUndoIncorrectMoves,
      autoUndoDelayMs,
      undoLastMove,
      saveStateSnapshot,
    ]
  );

  /**
   * Réinitialiser le problème
   */
  const reset = useCallback(() => {
    // Nettoyer le timeout d'annulation s'il existe
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    const game = ChessService.loadPosition(problem.position_fen);
    setState({
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: true,
      moveHistory: [],
      stateHistory: [],
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
    undoLastMove,
  };
}
