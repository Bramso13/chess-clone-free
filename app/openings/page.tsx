/**
 * Page de sélection des ouvertures
 * Affiche la liste des ouvertures disponibles et permet de les sélectionner pour l'entraînement
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Opening } from "@/types/chess";
import { getOpenings } from "@/lib/services/openingsService";
import { OpeningList } from "@/components/openings/OpeningList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function OpeningsPage() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOpenings();
      setOpenings(data);
    } catch (err) {
      console.error("Error fetching openings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les ouvertures. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Définir le titre de la page
    document.title = "Entraînement aux Ouvertures | Chess Clone Free";

    fetchOpenings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📚 Entraînement aux Ouvertures
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Sélectionnez une ouverture pour commencer votre entraînement
              </p>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
              aria-label="Retour à l'accueil"
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
              <span>Retour</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isLoading && <LoadingSpinner message="Chargement des ouvertures..." />}

        {error && !isLoading && (
          <ErrorMessage
            title="Erreur de chargement"
            message={error}
            onRetry={fetchOpenings}
          />
        )}

        {!isLoading && !error && (
          <>
            {/* En-tête de section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ouvertures disponibles
              </h2>
              <p className="text-gray-600">
                {openings.length === 0
                  ? "Aucune ouverture disponible pour le moment"
                  : `${openings.length} ouverture${
                      openings.length > 1 ? "s" : ""
                    } disponible${openings.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Liste des ouvertures */}
            <OpeningList openings={openings} />
          </>
        )}
      </main>
    </div>
  );
}
