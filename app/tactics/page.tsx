/**
 * Page de sélection des problèmes tactiques
 * Affiche la liste des problèmes avec filtres par difficulté et type
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TacticalProblem, TacticalDifficulty, TacticType } from "@/types/chess";
import { 
  getTacticalProblemsByFilter,
  getAvailableTacticTypes 
} from "@/lib/services/tacticsService";
import { ProblemFilters } from "@/components/tactics/ProblemFilters";
import { ProblemList } from "@/components/tactics/ProblemList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

/**
 * Page des problèmes tactiques
 */
export default function TacticsPage() {
  // État des données
  const [problems, setProblems] = useState<TacticalProblem[]>([]);
  const [availableTacticTypes, setAvailableTacticTypes] = useState<TacticType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État des filtres
  const [selectedDifficulty, setSelectedDifficulty] = useState<TacticalDifficulty | "all">("all");
  const [selectedTacticType, setSelectedTacticType] = useState<TacticType | "all">("all");

  // Charger les types de tactiques disponibles au montage
  useEffect(() => {
    async function loadTacticTypes() {
      try {
        const types = await getAvailableTacticTypes();
        setAvailableTacticTypes(types);
      } catch (err) {
        console.error("Erreur lors du chargement des types de tactiques:", err);
        // Ne pas bloquer l'interface si ça échoue
      }
    }
    loadTacticTypes();
  }, []);

  // Charger les problèmes avec les filtres actuels
  useEffect(() => {
    async function loadProblems() {
      try {
        setLoading(true);
        setError(null);

        const difficulty = selectedDifficulty === "all" ? undefined : selectedDifficulty;
        const tacticType = selectedTacticType === "all" ? undefined : selectedTacticType;

        const data = await getTacticalProblemsByFilter(difficulty, tacticType);
        setProblems(data);
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
  }, [selectedDifficulty, selectedTacticType]);

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedDifficulty("all");
    setSelectedTacticType("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-white rounded-lg border-2 border-gray-300
                hover:border-blue-400 hover:shadow-md
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
              Accueil
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Problèmes Tactiques
          </h1>
          <p className="text-lg text-gray-600">
            Améliorez vos compétences tactiques en résolvant des problèmes adaptés à votre niveau
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

        {!loading && !error && (
          <ProblemList problems={problems} isLoading={loading} />
        )}
      </div>
    </div>
  );
}
