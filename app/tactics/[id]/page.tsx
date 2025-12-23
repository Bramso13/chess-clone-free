/**
 * Page de résolution d'un problème tactique spécifique
 * Affiche l'interface de résolution avec échiquier interactif
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import type { TacticalProblem } from "@/types/chess";
import {
  getTacticalProblemById,
  getTacticalProblems,
} from "@/lib/services/tacticsService";
import { ProblemSolver } from "@/components/tactics/ProblemSolver";
import { ProblemNavigation } from "@/components/tactics/ProblemNavigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

interface TacticProblemPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Page de résolution d'un problème tactique
 */
export default function TacticProblemPage({ params }: TacticProblemPageProps) {
  const { id } = use(params);

  // État des données
  const [problem, setProblem] = useState<TacticalProblem | null>(null);
  const [allProblems, setAllProblems] = useState<TacticalProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le problème et la liste complète
  useEffect(() => {
    async function loadProblem() {
      try {
        setLoading(true);
        setError(null);

        // Charger le problème actuel et tous les problèmes en parallèle
        const [currentProblem, problems] = await Promise.all([
          getTacticalProblemById(id),
          getTacticalProblems(),
        ]);

        setProblem(currentProblem);
        setAllProblems(problems);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du problème"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProblem();
  }, [id]);

  // Trouver les IDs des problèmes précédent et suivant
  const currentIndex = allProblems.findIndex((p) => p.id === id);
  const previousProblemId =
    currentIndex > 0 ? allProblems[currentIndex - 1]?.id : null;
  const nextProblemId =
    currentIndex < allProblems.length - 1
      ? allProblems[currentIndex + 1]?.id
      : null;

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <Link
              href="/tactics"
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
              Retour à la liste
            </Link>
          </div>

          <ErrorMessage
            message={error || "Problème introuvable"}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // Affichage principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/tactics"
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
            Retour à la liste
          </Link>
        </div>

        {/* Interface de résolution */}
        <ProblemSolver
          problem={problem}
          previousProblemId={previousProblemId}
          nextProblemId={nextProblemId}
        />
      </div>
    </div>
  );
}

