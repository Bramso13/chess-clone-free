/**
 * Composant ErrorMessage
 * Affiche un message d'erreur utilisateur-friendly
 */

interface ErrorMessageProps {
  /** Message d'erreur à afficher */
  message: string;
  /** Titre optionnel de l'erreur */
  title?: string;
  /** Callback optionnel pour réessayer l'action */
  onRetry?: () => void;
}

export function ErrorMessage({ 
  message, 
  title = "Une erreur est survenue",
  onRetry 
}: ErrorMessageProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {title}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{message}</p>
            </div>
            {onRetry && (
              <div className="mt-4">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

