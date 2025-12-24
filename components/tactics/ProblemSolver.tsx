/**
 * Composant principal pour résoudre un problème tactique
 * Intègre l'échiquier et la logique de résolution
 */

"use client";

import { useEffect } from "react";
import type { TacticalProblem } from "@/types/chess";
import { Chessboard } from "@/components/chess/Chessboard";
import { useTacticsSolver } from "@/lib/hooks/useTacticsSolver";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { SuccessFeedback } from "./SuccessFeedback";
import { ErrorFeedback } from "./ErrorFeedback";
import { ProblemActions } from "./ProblemActions";
import { ProblemInstructions } from "./ProblemInstructions";

interface ProblemSolverProps {
  problem: TacticalProblem;
  /** ID du problème précédent (pour navigation) */
  previousProblemId?: string | null;
  /** ID du problème suivant (pour navigation) */
  nextProblemId?: string | null;
  /** Callback appelé quand le problème est résolu */
  onComplete?: () => void;
  /** Callback appelé quand le problème est échoué (optionnel, pour mode Extreme) */
  onFailed?: () => void;
}

/**
 * Composant ProblemSolver
 * Interface principale de résolution de problèmes tactiques
 */
export function ProblemSolver({
  problem,
  previousProblemId,
  nextProblemId,
  onComplete,
  onFailed,
}: ProblemSolverProps) {
  // Charger les préférences utilisateur
  const { preferences } = useUserPreferences();

  const {
    currentFen,
    feedback,
    isComplete,
    isPlayerTurn,
    movesPlayed,
    totalMoves,
    handleMove,
    reset,
  } = useTacticsSolver(problem, {
    autoUndoIncorrectMoves: preferences.autoUndoIncorrectMoves,
    autoUndoDelayMs: preferences.autoUndoDelayMs,
  });

  // Appeler les callbacks quand l'état change
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Déterminer l'orientation de l'échiquier
  const fenParts = problem.position_fen.split(" ");
  const boardOrientation = fenParts[1] === "w" ? "white" : "black";

  return (
    <div>
      {/* Instructions */}
      <ProblemInstructions
        problem={problem}
        movesPlayed={movesPlayed}
        totalMoves={totalMoves}
      />

      {/* Feedback de succès */}
      {isComplete && <SuccessFeedback problem={problem} />}

      {/* Feedback d'erreur */}
      {feedback === "incorrect" && (
        <ErrorFeedback
          autoDismissMs={
            preferences.autoUndoIncorrectMoves
              ? preferences.autoUndoDelayMs + 500
              : 2500
          }
          showUndoMessage={preferences.autoUndoIncorrectMoves}
        />
      )}

      {/* Feedback pour coup correct (pendant la résolution) */}
      {feedback === "correct" && !isComplete && (
        <div className="
          bg-green-50 rounded-lg border-2 border-green-300 p-4 mb-6
          animate-in fade-in slide-in-from-bottom-4 duration-300
        ">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-green-800 font-semibold">
              Excellent coup ! Continuez...
            </span>
          </div>
        </div>
      )}

      {/* Échiquier */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-6">
        {/* Indicateur de tour */}
        {!isComplete && (
          <div className="mb-4 text-center">
            <span
              className={`
                inline-block px-4 py-2 rounded-lg font-semibold
                ${
                  isPlayerTurn
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }
              `}
            >
              {isPlayerTurn ? "À vous de jouer" : "L'adversaire réfléchit..."}
            </span>
          </div>
        )}

        {/* L'échiquier */}
        <div className="max-w-2xl mx-auto">
          <Chessboard
            position={currentFen}
            onMove={handleMove}
            interactive={isPlayerTurn && !isComplete}
            boardOrientation={boardOrientation}
            showLegalMoves={true}
          />
        </div>

        {/* Légende */}
        {!isComplete && (
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              Cliquez sur une pièce puis sur la case de destination pour jouer
            </p>
          </div>
        )}
      </div>

      {/* Actions post-résolution */}
      {isComplete && (
        <ProblemActions
          currentProblemId={problem.id}
          previousProblemId={previousProblemId}
          nextProblemId={nextProblemId}
          onReset={reset}
        />
      )}

      {/* Bouton de réinitialisation (pendant la résolution, si des coups ont été joués) */}
      {!isComplete && movesPlayed > 0 && (
        <div className="flex justify-center mb-6">
          <button
            onClick={reset}
            className="
              px-4 py-2 bg-gray-100 hover:bg-gray-200
              text-gray-700 font-semibold rounded-lg
              border-2 border-gray-300
              transition-colors duration-200
              flex items-center gap-2
            "
            aria-label="Recommencer ce problème"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}

