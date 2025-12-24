/**
 * Page d'entraînement aux tactiques Lichess
 * Affiche la liste des puzzles tactiques importés de Lichess avec filtres
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TacticalProblem, TacticalDifficulty, TacticType } from "@/types/chess";
import { 
  getLichessTacticalProblemsPaginated,
  getAvailableTacticTypes 
} from "@/lib/services/tacticsService";
import { ProblemFilters } from "@/components/tactics/ProblemFilters";
import { ProblemList } from "@/components/tactics/ProblemList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Pagination } from "@/components/shared/Pagination";

/**
 * Page des puzzles tactiques Lichess
 */
const PAGE_SIZE = 20; // Nombre de puzzles par page

export default function LichessTacticsPage() {
  // État des données
  const [problems, setProblems] = useState<TacticalProblem[]>([]);
  const [availableTacticTypes, setAvailableTacticTypes] = useState<TacticType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État de la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // État des filtres
  const [selectedDifficulty, setSelectedDifficulty] = useState<TacticalDifficulty | "all">("all");
  const [selectedTacticType, setSelectedTacticType] = useState<TacticType | "all">("all");

  // Charger les types de tactiques disponibles au montage
  useEffect(() => {
    async function loadTacticTypes() {
      try {
        // Utiliser une requête paginée avec seulement quelques résultats pour obtenir les types
        const result = await getLichessTacticalProblemsPaginated({
          pagination: { page: 1, pageSize: 100 },
        });
        const types = Array.from(new Set(result.data.map((p) => p.tactic_type))).sort();
        setAvailableTacticTypes(types as TacticType[]);
      } catch (err) {
        console.error("Erreur lors du chargement des types de tactiques:", err);
        // Ne pas bloquer l'interface si ça échoue
      }
    }
    loadTacticTypes();
  }, []);

  // Réinitialiser la page à 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDifficulty, selectedTacticType]);

  // Charger les problèmes avec les filtres et pagination
  useEffect(() => {
    async function loadProblems() {
      try {
        setLoading(true);
        setError(null);

        const difficulty = selectedDifficulty === "all" ? undefined : selectedDifficulty;
        const tacticType = selectedTacticType === "all" ? undefined : selectedTacticType;

        const result = await getLichessTacticalProblemsPaginated({
          difficulty,
          tacticType,
          pagination: {
            page: currentPage,
            pageSize: PAGE_SIZE,
          },
        });

        setProblems(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement des problèmes"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProblems();
  }, [selectedDifficulty, selectedTacticType, currentPage]);

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedDifficulty("all");
    setSelectedTacticType("all");
    setCurrentPage(1); // Réinitialiser à la première page
  };

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll vers le haut de la liste
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/tactics"
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-white rounded-lg border-2 border-gray-300
                hover:border-purple-400 hover:shadow-md
                text-gray-700 font-medium
                transition-all duration-200
              "
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Retour aux Tactiques
            </Link>
            <Link
              href="/"
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-white rounded-lg border-2 border-gray-300
                hover:border-purple-400 hover:shadow-md
                text-gray-700 font-medium
                transition-all duration-200
              "
            >
              Accueil
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Tactiques Lichess
            </h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
              📊 Lichess
            </span>
          </div>
          <p className="text-lg text-gray-600">
            Entraînez-vous avec des puzzles tactiques importés de Lichess. Résolvez des problèmes variés pour améliorer vos compétences tactiques.
          </p>
        </div>

        {/* Filtres */}
        <ProblemFilters
          selectedDifficulty={selectedDifficulty}
          selectedTacticType={selectedTacticType}
          availableTacticTypes={availableTacticTypes}
          onDifficultyChange={setSelectedDifficulty}
          onTacticTypeChange={setSelectedTacticType}
          onReset={handleResetFilters}
        />

        {/* Contenu principal */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {error && !loading && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              setSelectedDifficulty("all");
              setSelectedTacticType("all");
            }}
          />
        )}

        {!loading && !error && problems.length === 0 && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 text-center">
            <p className="text-gray-600 text-lg">
              Aucun puzzle Lichess trouvé avec ces filtres.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!loading && !error && problems.length > 0 && (
          <>
            <ProblemList problems={problems} isLoading={loading} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={PAGE_SIZE}
              total={total}
            />
          </>
        )}
      </div>
    </div>
  );
}

