/**
 * Composant OpeningTrainer
 * Interface principale d'entraînement aux ouvertures avec validation en temps réel
 */

"use client";

import { Chessboard } from "@/components/chess/Chessboard";
import { MoveHistory } from "@/components/chess/MoveHistory";
import { FeedbackMessage } from "./FeedbackMessage";
import { VariationSelector } from "./VariationSelector";
import type { Opening } from "@/types/chess";
import type { Move } from "@/types/chess";
import { useOpeningTraining } from "@/lib/hooks/useOpeningTraining";
import { calculateProgress } from "@/lib/validation/moveValidation";

interface OpeningTrainerProps {
  opening: Opening;
}

export function OpeningTrainer({ opening }: OpeningTrainerProps) {
  const { state, actions } = useOpeningTraining(opening);

  const handleMove = (move: Move) => {
    actions.makeMove(move);
  };

  const progress = state.currentVariation
    ? calculateProgress(
        state.currentMoveIndex,
        state.currentVariation.moves.length
      )
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Panneau principal - Échiquier */}
      <div className="flex-1 lg:w-[70%]">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 lg:p-6">
          {/* En-tête */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {opening.name}
              </h2>
              <div className="flex items-center gap-2">
                {opening.is_custom && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Personnalisée
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {opening.eco_code}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Vous jouez:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-900 font-semibold">
                  {state.userColor === "white" ? "♔ Blancs" : "♚ Noirs"}
                </span>
              </div>
            </div>
          </div>

          {/* Sélecteur de variantes */}
          {state.opening && (
            <VariationSelector
              variations={state.opening.variations}
              currentVariationIndex={state.currentVariationIndex}
              onSelectVariation={actions.selectVariation}
            />
          )}

          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progression</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Échiquier */}
          <div className="aspect-square w-full max-w-[600px] mx-auto">
            <Chessboard
              position={state.position}
              onMove={handleMove}
              interactive={!state.isCompleted && !state.isOpponentThinking}
              showLegalMoves={true}
              boardOrientation={state.userColor === "white" ? "white" : "black"}
            />
          </div>

          {/* Indicateur ordinateur réfléchit */}
          {state.isOpponentThinking && (
            <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-3 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-800 font-medium">
                L'ordinateur joue...
              </span>
            </div>
          )}

          {/* Feedback */}
          {state.feedback && !state.isOpponentThinking && (
            <div className="mt-4">
              <FeedbackMessage
                validation={state.feedback}
                onUndo={state.feedback.valid ? undefined : actions.undoMove}
              />
            </div>
          )}

          {/* Message de complétion */}
          {state.isCompleted && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Félicitations !
              </h3>
              <p className="text-gray-700 mb-4">
                Vous avez complété la ligne d'ouverture avec succès !
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="bg-white rounded-lg px-4 py-2 border border-green-200">
                  <span className="text-gray-600">Coups corrects:</span>{" "}
                  <span className="font-bold text-green-600">
                    {state.score.correct}
                  </span>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-red-200">
                  <span className="text-gray-600">Coups incorrects:</span>{" "}
                  <span className="font-bold text-red-600">
                    {state.score.incorrect}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={actions.reset}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Rejouer
                </button>
              </div>
            </div>
          )}

          {/* Contrôles */}
          {!state.isCompleted && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={actions.undoMove}
                disabled={state.moveHistory.length === 0}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                ← Annuler
              </button>
              <button
                onClick={actions.reset}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                ↻ Recommencer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panneau latéral - Informations */}
      <div className="lg:w-[30%] space-y-4">
        {/* Score */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Score</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Corrects:</span>
              <span className="font-bold text-green-600 text-lg">
                {state.score.correct}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Incorrects:</span>
              <span className="font-bold text-red-600 text-lg">
                {state.score.incorrect}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-bold text-gray-900 text-lg">
                  {state.score.correct + state.score.incorrect}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des coups */}
        <MoveHistory moves={state.moveHistory} title="Historique" />

        {/* Informations sur l'ouverture */}
        {opening.description && (
          <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              À propos
            </h3>
            <p className="text-sm text-blue-800">{opening.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
