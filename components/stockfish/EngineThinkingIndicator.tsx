/**
 * Indicateur de réflexion du moteur Stockfish
 * Affiche une animation et le temps de réflexion
 */

interface EngineThinkingIndicatorProps {
  thinkingTime: number; // en millisecondes
  visible: boolean;
}

export function EngineThinkingIndicator({
  thinkingTime,
  visible,
}: EngineThinkingIndicatorProps) {
  if (!visible) {
    return null;
  }

  const seconds = (thinkingTime / 1000).toFixed(1);

  return (
    <div
      className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      role="status"
      aria-live="polite"
    >
      {/* Spinner animé */}
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* Message et temps */}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          Stockfish réfléchit...
        </p>
        <p className="text-xs text-gray-600">{seconds}s</p>
      </div>
    </div>
  );
}

