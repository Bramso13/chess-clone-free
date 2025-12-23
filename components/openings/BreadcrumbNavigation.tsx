/**
 * Composant Breadcrumb pour afficher le chemin parcouru dans l'exploration
 */

"use client";

interface BreadcrumbStep {
  /** Position FEN */
  fen: string;
  /** Coup joué pour arriver ici */
  move: string;
  /** Profondeur depuis le début */
  depth: number;
}

interface BreadcrumbNavigationProps {
  /** Chemin parcouru depuis la position initiale */
  path: BreadcrumbStep[];
  /** Callback appelé quand un élément du breadcrumb est cliqué */
  onStepClick: (step: BreadcrumbStep) => void;
}

export function BreadcrumbNavigation({
  path,
  onStepClick,
}: BreadcrumbNavigationProps) {
  if (path.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        <span className="font-semibold">Position initiale</span>
      </div>
    );
  }

  // Limiter l'affichage si le chemin est trop long
  const displayPath =
    path.length > 5
      ? [
          { ...path[0], move: "..." },
          ...path.slice(-4),
        ]
      : path;

  return (
    <nav className="flex items-center gap-2 text-sm overflow-x-auto">
      <button
        onClick={() => onStepClick(path[0])}
        className="text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap"
      >
        Position initiale
      </button>
      {displayPath.map((step, index) => (
        <div key={`${step.fen}-${index}`} className="flex items-center gap-2">
          <span className="text-gray-400">›</span>
          <button
            onClick={() => onStepClick(step)}
            className="text-blue-600 hover:text-blue-800 font-mono whitespace-nowrap"
          >
            {step.move}
          </button>
        </div>
      ))}
    </nav>
  );
}

