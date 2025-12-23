/**
 * Page de gestion des ouvertures personnalisées
 * Affiche la liste des ouvertures créées par l'utilisateur
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCustomOpenings,
  deleteCustomOpening,
} from "@/lib/openings/customOpeningService";
import type { Opening } from "@/types/chess";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function MyOpeningsPage() {
  const router = useRouter();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadOpenings();
  }, []);

  const loadOpenings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomOpenings();
      setOpenings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du chargement des ouvertures"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCustomOpening(id);
      setOpenings((prev) => prev.filter((opening) => opening.id !== id));
      setShowDeleteModal(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/openings"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              ← Retour à la liste des ouvertures
            </Link>
            <Link
              href="/openings/create"
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Créer une nouvelle ouverture
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mes ouvertures personnalisées
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez vos ouvertures personnalisées créées
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {openings.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">
              Vous n'avez pas encore créé d'ouvertures personnalisées.
            </p>
            <Link
              href="/openings/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Créer ma première ouverture
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openings.map((opening) => (
              <div
                key={opening.id}
                className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {opening.name}
                </h3>
                {opening.eco_code && (
                  <p className="text-sm text-gray-600 mb-2">
                    Code ECO: {opening.eco_code}
                  </p>
                )}
                <p className="text-sm text-gray-500 mb-4">
                  {opening.moves.length} coups • Créée le{" "}
                  {formatDate(opening.created_at)}
                </p>
                {opening.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {opening.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/openings/${opening.id}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Entraîner
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/openings/${opening.id}/edit`)
                    }
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() =>
                      setShowDeleteModal({
                        id: opening.id,
                        name: opening.name,
                      })
                    }
                    disabled={deletingId === opening.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer l'ouverture "
                {showDeleteModal.name}" ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(showDeleteModal.id)}
                  disabled={deletingId === showDeleteModal.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {deletingId === showDeleteModal.id
                    ? "Suppression..."
                    : "Supprimer"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  disabled={deletingId === showDeleteModal.id}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

