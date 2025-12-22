/**
 * Hook personnalisé pour gérer l'état de l'entraînement aux ouvertures
 */

import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import type { Opening, OpeningVariation } from "@/types/chess";
import type { Move } from "@/types/chess";
import { ChessService } from "@/lib/chess/chessService";
import {
  validateMoveAgainstOpening,
  type MoveValidationResult,
} from "@/lib/validation/moveValidation";

interface MoveHistoryEntry {
  move: string; // SAN notation
  valid: boolean;
  fen: string;
}

interface OpeningTrainingState {
  opening: Opening | null;
  currentVariation: OpeningVariation | null;
  currentVariationIndex: number;
  game: Chess;
  position: string; // FEN string pour forcer le re-render
  moveHistory: MoveHistoryEntry[];
  currentMoveIndex: number;
  feedback: MoveValidationResult | null;
  isCompleted: boolean;
  score: { correct: number; incorrect: number };
  isOpponentThinking: boolean;
  userColor: "white" | "black";
}

interface OpeningTrainingActions {
  makeMove: (move: Move | string) => boolean;
  undoMove: () => void;
  reset: () => void;
  selectVariation: (variationIndex: number) => void;
}

export function useOpeningTraining(opening: Opening | null): {
  state: OpeningTrainingState;
  actions: OpeningTrainingActions;
} {
  const [game, setGame] = useState<Chess>(() => ChessService.createGame());
  const [position, setPosition] = useState<string>("start");
  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState<MoveValidationResult | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [currentVariation, setCurrentVariation] =
    useState<OpeningVariation | null>(null);
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [userColor, setUserColor] = useState<"white" | "black">("white");

  // Initialiser la variante principale quand l'ouverture est chargée
  useEffect(() => {
    if (opening && opening.variations && opening.variations.length > 0) {
      const mainVariation = opening.variations[0];
      setCurrentVariation(mainVariation);
      setCurrentVariationIndex(0);

      // Utiliser le player_side de l'ouverture pour déterminer la couleur de l'utilisateur
      setUserColor(opening.player_side);
    }
  }, [opening]);

  // Jouer automatiquement le premier coup si l'utilisateur joue les Noirs
  useEffect(() => {
    if (
      !currentVariation ||
      isCompleted ||
      userColor !== "black" ||
      moveHistory.length > 0 ||
      currentMoveIndex !== 0
    ) {
      return;
    }

    // L'ordinateur doit jouer le premier coup (Blancs)
    setIsOpponentThinking(true);

    const timeout = setTimeout(() => {
      const firstMove = currentVariation.moves[0];

      try {
        const result = game.move(firstMove);
        if (result) {
          const newEntry: MoveHistoryEntry = {
            move: result.san,
            valid: true,
            fen: game.fen(),
          };

          setMoveHistory([newEntry]);
          setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
          setCurrentMoveIndex(1);
          const newFen = game.fen();
          setGame(new Chess(newFen));
          setPosition(newFen);
          setIsOpponentThinking(false);
        }
      } catch (error) {
        console.error("Error playing first opponent move:", error);
        setIsOpponentThinking(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      setIsOpponentThinking(false);
    };
  }, [
    currentVariation,
    userColor,
    moveHistory.length,
    currentMoveIndex,
    isCompleted,
    game,
  ]);

  // Jouer automatiquement le coup de l'adversaire après un coup correct de l'utilisateur
  useEffect(() => {
    if (!currentVariation || isCompleted || !feedback || !feedback.valid) {
      return;
    }

    // Vérifier si c'est au tour de l'adversaire
    const currentTurn = game.turn() === "w" ? "white" : "black";
    const isOpponentTurn = currentTurn !== userColor;

    if (isOpponentTurn && currentMoveIndex < currentVariation.moves.length) {
      // Indiquer que l'ordinateur réfléchit
      setIsOpponentThinking(true);

      // Attendre un court instant pour que l'utilisateur voie son coup
      const timeout = setTimeout(() => {
        const opponentMove = currentVariation.moves[currentMoveIndex];

        try {
          const result = game.move(opponentMove);
          if (result) {
            const newEntry: MoveHistoryEntry = {
              move: result.san,
              valid: true,
              fen: game.fen(),
            };

            setMoveHistory((prev) => [...prev, newEntry]);
            setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
            setCurrentMoveIndex((prev) => prev + 1);
            const newFen = game.fen();
            setGame(new Chess(newFen));
            setPosition(newFen);
            setIsOpponentThinking(false);

            // Vérifier si c'était le dernier coup
            if (currentMoveIndex >= currentVariation.moves.length - 1) {
              setFeedback({
                valid: true,
                message:
                  "🎉 Félicitations ! Vous avez complété la ligne d'ouverture !",
                completed: true,
              });
              setIsCompleted(true);
            } else {
              setFeedback(null);
            }
          }
        } catch (error) {
          console.error("Error playing opponent move:", error);
          setIsOpponentThinking(false);
        }
      }, 500); // Délai de 500ms pour l'effet visuel

      return () => {
        clearTimeout(timeout);
        setIsOpponentThinking(false);
      };
    }
  }, [feedback, currentVariation, game, currentMoveIndex, isCompleted]);

  const makeMove = useCallback(
    (move: Move | string): boolean => {
      if (!currentVariation || isCompleted) {
        return false;
      }

      try {
        // Valider et exécuter le coup
        const result = game.move(move as any);
        if (!result) {
          return false; // Coup illégal
        }

        const moveSan = result.san;

        // Valider contre l'ouverture
        const validation = validateMoveAgainstOpening(
          moveSan,
          currentVariation,
          currentMoveIndex
        );

        // Mettre à jour l'historique
        const newEntry: MoveHistoryEntry = {
          move: moveSan,
          valid: validation.valid,
          fen: game.fen(),
        };

        setMoveHistory((prev) => [...prev, newEntry]);
        setFeedback(validation);

        // Mettre à jour le score
        if (validation.valid) {
          setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
          setCurrentMoveIndex((prev) => prev + 1);
        } else {
          setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }

        // Vérifier si complété
        if (validation.completed) {
          setIsCompleted(true);
        }

        // Forcer la mise à jour du game et du position
        const newFen = game.fen();
        setGame(new Chess(newFen));
        setPosition(newFen);

        return true;
      } catch (error) {
        console.error("Error making move:", error);
        return false;
      }
    },
    [game, currentVariation, currentMoveIndex, isCompleted]
  );

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) {
      return;
    }

    // Vérifier si c'est au tour de l'utilisateur
    const currentTurn = game.turn() === "w" ? "white" : "black";
    const isUserTurn = currentTurn === userColor;

    // Si c'est au tour de l'utilisateur, on doit annuler 2 coups (adversaire + utilisateur)
    const shouldUndoTwo = isUserTurn && moveHistory.length >= 2;
    const couplesToUndo = shouldUndoTwo ? 2 : 1;

    // Ajuster le score pour les coups annulés
    for (let i = 0; i < couplesToUndo; i++) {
      const lastEntry = moveHistory[moveHistory.length - 1 - i];

      if (lastEntry && lastEntry.valid) {
        setScore((prev) => ({
          ...prev,
          correct: Math.max(0, prev.correct - 1),
        }));
        setCurrentMoveIndex((prev) => Math.max(0, prev - 1));
      } else if (lastEntry) {
        setScore((prev) => ({
          ...prev,
          incorrect: Math.max(0, prev.incorrect - 1),
        }));
      }
    }

    // Mettre à jour l'historique
    const newHistory = moveHistory.slice(0, -couplesToUndo);
    setMoveHistory(newHistory);

    // Reconstruire la position depuis le début en rejouant tous les coups restants
    const newGame = new Chess();
    for (const entry of newHistory) {
      newGame.move(entry.move);
    }

    const newFen = newGame.fen();
    setGame(newGame);
    setPosition(newFen);
    setFeedback(null);
    setIsCompleted(false);
  }, [game, moveHistory, userColor, position]);

  const reset = useCallback(() => {
    const newGame = ChessService.createGame();
    setGame(newGame);
    setPosition("start");
    setMoveHistory([]);
    setCurrentMoveIndex(0);
    setFeedback(null);
    setIsCompleted(false);
    setScore({ correct: 0, incorrect: 0 });
  }, []);

  const selectVariation = useCallback(
    (variationIndex: number) => {
      if (!opening || !opening.variations[variationIndex]) {
        return;
      }

      const newVariation = opening.variations[variationIndex];

      // Utiliser le player_side de l'ouverture (le même pour toutes les variantes)
      setCurrentVariation(newVariation);
      setCurrentVariationIndex(variationIndex);
      setUserColor(opening.player_side);
      reset();
    },
    [opening, reset]
  );

  return {
    state: {
      opening,
      currentVariation,
      currentVariationIndex,
      game,
      position,
      moveHistory,
      currentMoveIndex,
      feedback,
      isCompleted,
      score,
      isOpponentThinking,
      userColor,
    },
    actions: {
      makeMove,
      undoMove,
      reset,
      selectVariation,
    },
  };
}
