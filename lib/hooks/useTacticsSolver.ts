/**
 * Hook personnalisé pour la résolution de problèmes tactiques
 * Gère la logique de validation des coups et la progression dans la solution
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
 * Détermine qui est le joueur (celui qui gagne) en analysant la solution complète
 * Retourne aussi quels coups appartiennent au gagnant
 */
function determinePlayerAndMoves(
  initialFen: string,
  solutionMoves: string[]
): {
  playerColor: "white" | "black";
  playerMoveIndices: number[];
} {
  try {
    const game = ChessService.loadPosition(initialFen);

    // Jouer tous les coups pour analyser la position finale
    for (const move of solutionMoves) {
      ChessService.makeMove(game, move);
    }

    // Analyser la position finale pour déterminer qui gagne
    const finalState = ChessService.getGameState(game);
    let winnerColor: "white" | "black";

    if (finalState.isCheckmate) {
      // Si c'est mat, le camp qui vient de jouer a fait mat à l'adversaire
      // Le gagnant est celui qui a fait mat (l'autre camp que celui qui doit jouer)
      winnerColor = finalState.turn === "white" ? "black" : "white";
    } else {
      // Si pas de mat, le gagnant est celui qui joue le premier coup (supposition)
      const initialGame = ChessService.loadPosition(initialFen);
      winnerColor = initialGame.turn() === "w" ? "white" : "black";
    }

    // Recalculer quels coups appartiennent au gagnant
    const initialGame = ChessService.loadPosition(initialFen);
    const initialColor = initialGame.turn() === "w" ? "white" : "black";

    // Identifier quels coups appartiennent au gagnant
    const winnerMoveIndices: number[] = [];
    let color = initialColor;
    for (let i = 0; i < solutionMoves.length; i++) {
      if (color === winnerColor) {
        winnerMoveIndices.push(i);
      }
      color = color === "white" ? "black" : "white";
    }

    return {
      playerColor: winnerColor,
      playerMoveIndices: winnerMoveIndices,
    };
  } catch {
    // En cas d'erreur, fallback
    const game = ChessService.loadPosition(initialFen);
    const initialColor = game.turn() === "w" ? "white" : "black";
    // Par défaut, le joueur joue les coups pairs
    const playerMoveIndices = [];
    for (let i = 0; i < solutionMoves.length; i += 2) {
      playerMoveIndices.push(i);
    }
    return {
      playerColor: initialColor,
      playerMoveIndices,
    };
  }
}

/**
 * Détermine si c'est au tour du joueur en fonction de l'index du coup
 * Le joueur joue uniquement les coups du gagnant
 */
function determineIsPlayerTurn(
  moveIndex: number,
  playerMoveIndices: number[]
): boolean {
  if (playerMoveIndices.length === 0) {
    return false;
  }

  if (moveIndex > playerMoveIndices[playerMoveIndices.length - 1]) {
    return false;
  }

  // Le joueur joue uniquement les coups qui appartiennent au gagnant
  return playerMoveIndices.includes(moveIndex);
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

  // Pour les tactiques Lichess (source="imported"), le premier coup est joué automatiquement par l'adversaire
  // Le joueur joue ensuite les coups impairs (1, 3, 5...), l'adversaire joue les coups pairs (0, 2, 4...)
  const isLichessTactic = problem.source === "imported";

  // Déterminer qui est le joueur (celui qui gagne) et quels coups il joue
  const { playerColor, playerMoveIndices } = useMemo(
    () => determinePlayerAndMoves(problem.position_fen, problem.solution_moves),
    [problem.position_fen, problem.solution_moves]
  );

  // État initial
  const [state, setState] = useState<TacticsSolverState>(() => {
    const game = ChessService.loadPosition(problem.position_fen);

    let initialIsPlayerTurn: boolean;

    if (isLichessTactic) {
      // Pour Lichess : le premier coup (index 0) est joué automatiquement par l'adversaire
      // Le joueur joue les coups impairs (1, 3, 5...)
      initialIsPlayerTurn = false; // L'adversaire joue d'abord
    } else {
      // Pour les autres tactiques : le joueur joue les coups du gagnant
      const { playerMoveIndices: initialPlayerMoveIndices } =
        determinePlayerAndMoves(problem.position_fen, problem.solution_moves);

      initialIsPlayerTurn = initialPlayerMoveIndices.includes(0);

      // Fallback si nécessaire
      if (initialPlayerMoveIndices.length === 0 || !initialIsPlayerTurn) {
        initialIsPlayerTurn = true;
      }
    }

    return {
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: initialIsPlayerTurn,
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

    let initialIsPlayerTurn: boolean;

    if (isLichessTactic) {
      // Pour Lichess : le premier coup (index 0) est joué automatiquement par l'adversaire
      initialIsPlayerTurn = false; // L'adversaire joue d'abord
    } else {
      // Pour les autres tactiques : le joueur joue les coups du gagnant
      const { playerMoveIndices } = determinePlayerAndMoves(
        problem.position_fen,
        problem.solution_moves
      );

      initialIsPlayerTurn = playerMoveIndices.includes(0);
      if (playerMoveIndices.length === 0 || !initialIsPlayerTurn) {
        initialIsPlayerTurn = true; // Fallback
      }
    }

    setState({
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: initialIsPlayerTurn,
      moveHistory: [],
      stateHistory: [],
    });
  }, [problem.id, problem.position_fen, isLichessTactic]);

  // Pour Lichess : jouer automatiquement le premier coup (adversaire) au démarrage
  useEffect(() => {
    if (
      isLichessTactic &&
      state.currentMoveIndex === 0 &&
      !state.isPlayerTurn &&
      !state.isComplete
    ) {
      // Le premier coup est celui de l'adversaire, le jouer automatiquement
      const opponentMove = problem.solution_moves[0];
      if (opponentMove) {
        setTimeout(() => {
          const newGame = new Chess(state.game.fen());
          ChessService.makeMove(newGame, opponentMove);

          const newMoveIndex = 1;
          const isNowComplete = newMoveIndex >= problem.solution_moves.length;

          setState({
            game: newGame,
            currentMoveIndex: newMoveIndex,
            isComplete: isNowComplete,
            lastFeedback: null,
            currentFen: newGame.fen(),
            isPlayerTurn: !isNowComplete, // Après le coup de l'adversaire, c'est au joueur (index 1 = impair)
            moveHistory: [opponentMove],
            stateHistory: [],
          });
        }, 500);
      }
    }
  }, [
    isLichessTactic,
    state.currentMoveIndex,
    state.isPlayerTurn,
    state.isComplete,
    state.game,
    problem.solution_moves,
  ]);

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
   * IMPORTANT: Cette fonction ne doit être appelée QUE pour les coups de l'adversaire (index impairs)
   */
  const playOpponentMove = useCallback(
    (currentState: TacticsSolverState) => {
      // Vérifier s'il y a un coup adversaire à jouer
      if (currentState.currentMoveIndex >= problem.solution_moves.length) {
        return;
      }

      // Pour Lichess : l'adversaire joue les coups pairs (0, 2, 4...)
      // Pour les autres : l'adversaire joue les coups qui ne sont pas du gagnant
      let isOpponentMove: boolean;

      if (isLichessTactic) {
        // Lichess : adversaire joue les coups pairs (0, 2, 4...)
        isOpponentMove = currentState.currentMoveIndex % 2 === 0;
      } else {
        // Autres tactiques : adversaire joue les coups qui ne sont pas du gagnant
        isOpponentMove =
          playerMoveIndices.length > 0
            ? !playerMoveIndices.includes(currentState.currentMoveIndex)
            : currentState.currentMoveIndex % 2 === 1; // Fallback : coups impairs
      }

      if (!isOpponentMove) {
        // Ce n'est pas un coup de l'adversaire, ne rien faire
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

        // Déterminer si c'est au tour du joueur après le coup de l'adversaire
        let nextIsPlayerTurn = false;
        if (!isNowComplete) {
          if (isLichessTactic) {
            // Lichess : le joueur joue les coups impairs (1, 3, 5...)
            nextIsPlayerTurn = newMoveIndex % 2 === 1;
          } else {
            // Autres tactiques : le joueur joue les coups du gagnant
            if (playerMoveIndices.length > 0) {
              nextIsPlayerTurn = determineIsPlayerTurn(
                newMoveIndex,
                playerMoveIndices
              );
            } else {
              // Fallback : le joueur joue les coups pairs
              nextIsPlayerTurn = newMoveIndex % 2 === 0;
            }
          }
        }

        setState({
          game: newGame,
          currentMoveIndex: newMoveIndex,
          isComplete: isNowComplete,
          lastFeedback: null, // Réinitialiser le feedback
          currentFen: newGame.fen(),
          isPlayerTurn: nextIsPlayerTurn,
          moveHistory: [...currentState.moveHistory, opponentMove],
          stateHistory: currentState.stateHistory, // Préserver l'historique
        });
      }, 800);
    },
    [problem.solution_moves, playerMoveIndices, isLichessTactic]
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

      // VÉRIFICATION CRITIQUE : Le joueur ne doit jouer QUE ses propres coups
      let isPlayerMove: boolean;

      if (isLichessTactic) {
        // Lichess : le joueur joue les coups impairs (1, 3, 5...)
        isPlayerMove = state.currentMoveIndex % 2 === 1;
      } else {
        // Autres tactiques : le joueur joue les coups du gagnant
        isPlayerMove =
          playerMoveIndices.length > 0
            ? playerMoveIndices.includes(state.currentMoveIndex)
            : state.currentMoveIndex % 2 === 0; // Fallback : coups pairs
      }

      if (!isPlayerMove) {
        // Ce n'est pas un coup du joueur, ne rien faire
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

      // Vérifier si le coup correspond au coup attendu (qui DOIT être un coup du joueur)
      const expectedMove = problem.solution_moves[state.currentMoveIndex];

      if (sanMove === expectedMove) {
        // Coup correct !
        const newGame = new Chess(state.game.fen());
        ChessService.makeMove(newGame, sanMove);

        const newMoveIndex = state.currentMoveIndex + 1;
        const isNowComplete = newMoveIndex >= problem.solution_moves.length;

        // Déterminer si c'est au tour du joueur après ce coup
        let nextIsPlayerTurn = false;
        if (!isNowComplete) {
          if (isLichessTactic) {
            // Lichess : le joueur joue les coups impairs (1, 3, 5...)
            nextIsPlayerTurn = newMoveIndex % 2 === 1;
          } else {
            // Autres tactiques : le joueur joue les coups du gagnant
            if (playerMoveIndices.length > 0) {
              nextIsPlayerTurn = determineIsPlayerTurn(
                newMoveIndex,
                playerMoveIndices
              );
            } else {
              // Fallback : le joueur joue les coups pairs
              nextIsPlayerTurn = newMoveIndex % 2 === 0;
            }
          }
        }

        const newState: TacticsSolverState = {
          game: newGame,
          currentMoveIndex: newMoveIndex,
          isComplete: isNowComplete,
          lastFeedback: "correct",
          currentFen: newGame.fen(),
          isPlayerTurn: nextIsPlayerTurn,
          moveHistory: [...state.moveHistory, sanMove],
          stateHistory: [], // Réinitialiser l'historique après un coup correct (on ne peut pas annuler un coup correct)
        };

        setState(newState);

        // Si pas terminé ET que ce n'est plus au tour du joueur, jouer le coup de l'adversaire
        // Le joueur ne joue QUE ses propres coups (index pairs), l'adversaire joue automatiquement
        if (!isNowComplete && !nextIsPlayerTurn) {
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
      playerMoveIndices,
      isLichessTactic,
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

    let initialIsPlayerTurn: boolean;

    if (isLichessTactic) {
      // Pour Lichess : le premier coup (index 0) est joué automatiquement par l'adversaire
      initialIsPlayerTurn = false; // L'adversaire joue d'abord
    } else {
      // Pour les autres tactiques : le joueur joue les coups du gagnant
      const { playerMoveIndices: resetPlayerMoveIndices } =
        determinePlayerAndMoves(problem.position_fen, problem.solution_moves);
      if (resetPlayerMoveIndices.length > 0) {
        initialIsPlayerTurn = resetPlayerMoveIndices.includes(0);
      } else {
        initialIsPlayerTurn = true; // Fallback
      }
    }

    setState({
      game,
      currentMoveIndex: 0,
      isComplete: false,
      lastFeedback: null,
      currentFen: problem.position_fen,
      isPlayerTurn: initialIsPlayerTurn,
      moveHistory: [],
      stateHistory: [],
    });
  }, [problem.position_fen, isLichessTactic]);

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
