/**
 * Composant LoadingSpinner
 * Affiche un indicateur de chargement visuel
 */

interface LoadingSpinnerProps {
  /** Message optionnel à afficher sous le spinner */
  message?: string;
  /** Taille du spinner: 'sm' | 'md' | 'lg' */
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ 
  message = "Chargement...", 
  size = "md" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-12 h-12 border-3",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
        role="status"
        aria-label="Chargement en cours"
      />
      {message && (
        <p className="mt-4 text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
}

