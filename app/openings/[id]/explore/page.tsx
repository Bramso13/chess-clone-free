/**
 * Page d'exploration de variantes d'ouvertures
 * Route: /openings/[id]/explore
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Opening } from "@/types/chess";
import { getOpeningById } from "@/lib/services/openingsService";
import { useOpeningExploration, getOpeningPositionFen } from "@/lib/hooks/useOpeningExploration";
import { VariationTreeView } from "@/components/openings/VariationTreeView";
import { Chessboard } from "@/components/chess/Chessboard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { ExplorationConfiguration } from "@/components/openings/ExplorationConfiguration";

export default function OpeningExplorationPage() {
  const params = useParams();
  const router = useRouter();
  const openingId = params.id as string;

  const [opening, setOpening] = useState<Opening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    maxDepth: 3,
    maxVariationsPerLevel: 15,
    stockfishDepth: 12,
  });

  const exploration = useOpeningExploration();

  useEffect(() => {
    document.title = "Exploration | Chess Clone Free";

    const fetchOpening = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getOpeningById(openingId);
        setOpening(data);
        document.title = `Exploration - ${data.name} | Chess Clone Free`;
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

  useEffect(() => {
    if (opening && !exploration.variationTree) {
      // Générer les variantes à partir de la position de l'ouverture
      const initialFen = getOpeningPositionFen(opening.moves);
      exploration.generateVariations(initialFen, {
        maxDepth: config.maxDepth,
        maxVariationsPerLevel: config.maxVariationsPerLevel,
      });
    }
  }, [opening, exploration, config]);

  const handleGenerate = async () => {
    if (!opening) return;
    const initialFen = getOpeningPositionFen(opening.moves);
    await exploration.generateVariations(initialFen, {
      maxDepth: config.maxDepth,
      maxVariationsPerLevel: config.maxVariationsPerLevel,
    });
  };

  const handleAnalyze = async () => {
    await exploration.analyzeVariations({
      depth: config.stockfishDepth,
    });
  };

  const handleNodeSelect = (node: any) => {
    exploration.selectPosition(node.fen, node);
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Retour aux ouvertures</span>
              </Link>
              {opening && (
                <Link
                  href={`/openings/${openingId}`}
                  className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
                >
                  Entraînement standard
                </Link>
              )}
            </div>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              Accueil
            </Link>
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
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !error && opening && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Exploration - {opening.name}
              </h1>
              <p className="text-gray-600">
                Explorez toutes les variantes possibles de cette ouverture avec
                l'analyse Stockfish
              </p>
            </div>

            <ExplorationConfiguration
              config={config}
              onConfigChange={setConfig}
              onGenerate={handleGenerate}
              onAnalyze={handleAnalyze}
              isGenerating={exploration.isGenerating}
              isAnalyzing={exploration.isAnalyzing}
              analysisProgress={exploration.analysisProgress}
            />

            {exploration.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{exploration.error}</p>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Tree View */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Arbre de variantes
                </h2>
                {exploration.isGenerating && (
                  <LoadingSpinner message="Génération des variantes..." />
                )}
                {exploration.variationTree && (
                  <VariationTreeView
                    tree={exploration.variationTree}
                    analyzedVariations={exploration.analyzedVariations}
                    selectedNode={exploration.selectedNode}
                    onNodeSelect={handleNodeSelect}
                  />
                )}
              </div>

              {/* Chessboard */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Position</h2>
                {exploration.selectedPosition && (
                  <div className="flex justify-center">
                    <Chessboard
                      position={exploration.selectedPosition}
                      interactive={false}
                      boardOrientation={opening.player_side}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

