/**
 * Composant de pagination réutilisable
 */

interface PaginationProps {
  /** Page actuelle (1-based) */
  currentPage: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Callback appelé lors du changement de page */
  onPageChange: (page: number) => void;
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Nombre total d'éléments */
  total: number;
}

/**
 * Composant de pagination avec navigation
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  total,
}: PaginationProps) {
  // Calculer la plage de pages à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Nombre max de boutons de page visibles

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages si on a moins de maxVisible pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Ajuster si on est proche du début
      if (currentPage <= 3) {
        end = Math.min(5, totalPages - 1);
      }

      // Ajuster si on est proche de la fin
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 4);
      }

      // Ajouter des ellipses et les pages autour de la page actuelle
      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Toujours afficher la dernière page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculer les indices des éléments affichés
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Informations sur les éléments affichés */}
      <div className="text-sm text-gray-600">
        Affichage de {startIndex} à {endIndex} sur {total} puzzles
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center gap-2">
        {/* Bouton Précédent */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200
            ${
              currentPage === 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-purple-300 text-purple-700 hover:border-purple-500 hover:bg-purple-50 bg-white"
            }
          `}
          aria-label="Page précédente"
        >
          Précédent
        </button>

        {/* Numéros de pages */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  min-w-[2.5rem] px-3 py-2 rounded-lg border-2 font-medium transition-all duration-200
                  ${
                    isActive
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-purple-300 text-purple-700 hover:border-purple-500 hover:bg-purple-50 bg-white"
                  }
                `}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200
            ${
              currentPage === totalPages
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-purple-300 text-purple-700 hover:border-purple-500 hover:bg-purple-50 bg-white"
            }
          `}
          aria-label="Page suivante"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

