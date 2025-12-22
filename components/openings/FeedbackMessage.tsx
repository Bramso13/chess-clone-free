/**
 * Composant FeedbackMessage
 * Affiche le feedback visuel après chaque coup
 */

import type { MoveValidationResult } from "@/lib/validation/moveValidation";

interface FeedbackMessageProps {
  validation: MoveValidationResult | null;
  onUndo?: () => void;
}

export function FeedbackMessage({ validation, onUndo }: FeedbackMessageProps) {
  if (!validation) {
    return null;
  }

  const isCorrect = validation.valid;
  const isCompleted = validation.completed;

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all duration-300 ${
        isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
            isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isCorrect ? "✓" : "✗"}
        </div>

        {/* Contenu */}
        <div className="flex-1">
          <p
            className={`font-semibold ${
              isCorrect ? "text-green-900" : "text-red-900"
            }`}
          >
            {validation.message}
          </p>

          {!isCorrect && validation.expectedMove && (
            <p className="text-sm text-red-700 mt-1">
              Coup attendu:{" "}
              <span className="font-mono font-bold">
                {validation.expectedMove}
              </span>
            </p>
          )}

          {isCompleted && isCorrect && (
            <p className="text-sm text-green-700 mt-2">
              Ligne d'ouverture complétée avec succès !
            </p>
          )}
        </div>

        {/* Bouton Annuler (seulement pour coups incorrects) */}
        {!isCorrect && !isCompleted && onUndo && (
          <button
            onClick={onUndo}
            className="flex-shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Annuler le dernier coup"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
