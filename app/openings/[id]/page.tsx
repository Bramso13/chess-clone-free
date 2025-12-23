/**
 * Page d'entraînement pour une ouverture spécifique
 * Route dynamique: /openings/[id]
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Opening } from "@/types/chess";
import { getOpeningById } from "@/lib/services/openingsService";
import { OpeningTrainer } from "@/components/openings/OpeningTrainer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function OpeningTrainingPage() {
  const params = useParams();
  const router = useRouter();
  const openingId = params.id as string;

  const [opening, setOpening] = useState<Opening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Définir le titre de la page
    document.title = "Entraînement | Chess Clone Free";

    const fetchOpening = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getOpeningById(openingId);
        setOpening(data);
        // Mettre à jour le titre avec le nom de l'ouverture
        document.title = `${data.name} | Chess Clone Free`;
      } catch (err) {
        console.error("Error fetching opening:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'ouverture. Veuillez réessayer."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (openingId) {
      fetchOpening();
    }
  }, [openingId]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/openings"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
                aria-label="Retour à la liste des ouvertures"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Retour aux ouvertures</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href={`/openings/${openingId}/explore`}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Explorer les variantes
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <LoadingSpinner message="Chargement de l'ouverture..." />
        )}

        {error && !isLoading && (
          <ErrorMessage
            title="Erreur de chargement"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {!isLoading && !error && opening && (
          <OpeningTrainer opening={opening} />
        )}
      </main>
    </div>
  );
}

