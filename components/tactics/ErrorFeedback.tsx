/**
 * Composant de feedback d'erreur pour les coups incorrects
 * Affiche un message indiquant que le coup n'est pas optimal
 */

"use client";

import { useEffect, useState } from "react";

interface ErrorFeedbackProps {
  /** Callback quand le feedback disparaît */
  onDismiss?: () => void;
  /** Auto-dismissal après X millisecondes (par défaut 2500ms) */
  autoDismissMs?: number;
  /** Afficher un message indiquant que le coup sera annulé automatiquement */
  showUndoMessage?: boolean;
}

/**
 * Composant ErrorFeedback
 * Affiche le feedback d'erreur avec auto-dismissal optionnel
 */
export function ErrorFeedback({
  onDismiss,
  autoDismissMs = 2500,
  showUndoMessage = false,
}: ErrorFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismissal après délai
  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          setTimeout(onDismiss, 300); // Attendre l'animation de sortie
        }
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="
        bg-red-50 rounded-lg border-2 border-red-300 p-4 mb-6
        animate-in fade-in slide-in-from-bottom-4 duration-300
      "
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* Icône d'erreur */}
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-red-800 font-semibold">
            Ce n'est pas le meilleur coup. Réessayez !
          </p>
          {showUndoMessage ? (
            <p className="text-red-700 text-sm mt-1">
              Le coup sera automatiquement annulé dans un instant...
            </p>
          ) : (
            <p className="text-red-700 text-sm mt-1">
              Réfléchissez à la position et trouvez la meilleure combinaison.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

