/**
 * Composant de génération de tactiques avec sélection du nombre de coups
 * Permet de générer des tactiques et de les visualiser avec animation
 */

"use client";

import { useState } from "react";
import { TacticGeneratorService } from "@/lib/tactics/tacticGeneratorService";
import { getStockfishService } from "@/lib/stockfish/stockfishService";
import type { GeneratedTactic } from "@/lib/tactics/tacticGeneratorService";
import { TacticPositionViewer } from "./TacticPositionViewer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Chessboard } from "@/components/chess/Chessboard";

type MoveCountOption = "2-3" | "4-5" | "6+" | "custom";

interface TacticGeneratorProps {
  /** Nombre de tactiques à générer par défaut */
  defaultCount?: number;
}

/**
 * Composant TacticGenerator
 */
export function TacticGenerator({ defaultCount = 10 }: TacticGeneratorProps) {
  const [moveCountOption, setMoveCountOption] = useState<MoveCountOption>("2-3");
  const [customMin, setCustomMin] = useState<number>(2);
  const [customMax, setCustomMax] = useState<number>(5);
  const [generating, setGenerating] = useState(false);
  const [generatedTactics, setGeneratedTactics] = useState<GeneratedTactic[]>([]);
  const [currentTacticIndex, setCurrentTacticIndex] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedTactics, setSavedTactics] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState<{
    positionsAnalyzed: number;
    tacticsFound: number;
    currentPosition?: string;
    status: string;
    newTactics?: GeneratedTactic[];
  } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGeneratedTactics([]);
    setCurrentTacticIndex(0);
    setSavedTactics(new Set());

    try {
      // Préparer les options selon le choix
      let options: { minMoves?: number; maxMoves?: number; exactMoves?: number } = {};

      switch (moveCountOption) {
        case "2-3":
          options = { minMoves: 2, maxMoves: 3 };
          break;
        case "4-5":
          options = { minMoves: 4, maxMoves: 5 };
          break;
        case "6+":
          options = { minMoves: 6 };
          break;
        case "custom":
          options = { minMoves: customMin, maxMoves: customMax };
          break;
      }

      // Initialiser le service
      const stockfishService = getStockfishService();
      if (!stockfishService.isReady()) {
        await stockfishService.initialize();
      }

      const generatorService = new TacticGeneratorService(stockfishService);

      // Générer les tactiques depuis la position initiale avec affichage en temps réel
      const allTactics = await generatorService.generateTacticsFromStartPosition(
        {
          ...options,
          count: defaultCount,
          maxDepth: 10, // Limiter la profondeur pour la performance
        },
        (progress) => {
          setSearchProgress(progress);
          // Mettre à jour les tactiques trouvées en temps réel
          if (progress.newTactics && progress.newTactics.length > 0) {
            setGeneratedTactics((prev) => [...prev, ...progress.newTactics!]);
          }
        }
      );
      
      if (allTactics.length === 0) {
        setError("Aucune tactique trouvée avec les critères sélectionnés. Essayez de modifier les paramètres ou d'augmenter la profondeur de recherche.");
      } else {
        // S'assurer que toutes les tactiques sont bien présentes
        setGeneratedTactics(allTactics);
      }
      
      setSearchProgress(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur lors de la génération: ${errorMessage}`);
      console.error("Erreur de génération:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (index: number) => {
    const tactic = generatedTactics[index];
    if (!tactic) return;

    setSaving(true);
    try {
      const stockfishService = getStockfishService();
      const generatorService = new TacticGeneratorService(stockfishService);
      
      await generatorService.saveTactic(tactic);
      setSavedTactics((prev) => new Set([...prev, index]));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`);
      console.error("Erreur de sauvegarde:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentTacticIndex < generatedTactics.length - 1) {
      setCurrentTacticIndex(currentTacticIndex + 1);
    }
  };

  const currentTactic = generatedTactics[currentTacticIndex];

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Générer des tactiques</h2>

      {/* Formulaire de sélection */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de coups souhaité:
          </label>
          <select
            value={moveCountOption}
            onChange={(e) => setMoveCountOption(e.target.value as MoveCountOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generating}
          >
            <option value="2-3">2-3 coups (Facile)</option>
            <option value="4-5">4-5 coups (Moyen)</option>
            <option value="6+">6+ coups (Complexe)</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        {moveCountOption === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min coups:
              </label>
              <input
                type="number"
                value={customMin}
                onChange={(e) => setCustomMin(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={generating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max coups:
              </label>
              <input
                type="number"
                value={customMax}
                onChange={(e) => setCustomMax(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={generating}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {generating ? "Génération en cours..." : "Générer"}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Recherche en temps réel */}
      {generating && searchProgress && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Recherche en cours...</h3>
              <LoadingSpinner />
            </div>
            
            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">Positions analysées</div>
                <div className="text-2xl font-bold text-blue-600">{searchProgress.positionsAnalyzed}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">Tactiques trouvées</div>
                <div className="text-2xl font-bold text-green-600">{searchProgress.tacticsFound}</div>
              </div>
            </div>

            {/* Échiquier avec position actuelle */}
            {searchProgress.currentPosition && (
              <div className="bg-white rounded-lg border-2 border-blue-300 p-4">
                <div className="text-sm text-gray-600 mb-2">Position actuellement analysée:</div>
                <div className="max-w-md mx-auto">
                  <Chessboard
                    position={searchProgress.currentPosition}
                    interactive={false}
                    boardOrientation="white"
                  />
                </div>
              </div>
            )}

            {/* Statut */}
            <div className="mt-4 text-center">
              <p className="text-gray-700 font-medium">{searchProgress.status}</p>
            </div>
          </div>

          {/* Tactiques trouvées en temps réel */}
          {generatedTactics.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                {generatedTactics.length} tactique(s) trouvée(s) jusqu'à présent
              </h4>
              <div className="space-y-2">
                {generatedTactics.map((tactic, index) => (
                  <div key={index} className="bg-white rounded p-2 text-sm">
                    <span className="font-medium">{tactic.tactic_type}</span> - {tactic.difficulty} - {tactic.solution_moves.length} coups
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicateur de chargement simple (si pas de progression disponible) */}
      {generating && !searchProgress && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Initialisation de la recherche...</p>
        </div>
      )}

      {/* Message si aucune tactique trouvée */}
      {!generating && generatedTactics.length === 0 && !error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Aucune tactique générée. Cliquez sur "Générer" pour commencer.
        </div>
      )}

      {/* Résultats */}
      {generatedTactics.length > 0 && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {generatedTactics.length} tactique(s) générée(s)
          </div>

          {/* Navigation entre tactiques */}
          {generatedTactics.length > 1 && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded">
              <button
                onClick={() => setCurrentTacticIndex(Math.max(0, currentTacticIndex - 1))}
                disabled={currentTacticIndex === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <span className="text-gray-700">
                Tactique {currentTacticIndex + 1} / {generatedTactics.length}
              </span>
              <button
                onClick={() =>
                  setCurrentTacticIndex(
                    Math.min(generatedTactics.length - 1, currentTacticIndex + 1)
                  )
                }
                disabled={currentTacticIndex === generatedTactics.length - 1}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
            </div>
          )}

          {/* Affichage de la tactique actuelle */}
          {currentTactic && (
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
              {/* Informations de la tactique */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Type:</span>
                  <p className="font-medium">{currentTactic.tactic_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Difficulté:</span>
                  <p className="font-medium">{currentTactic.difficulty}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Nombre de coups:</span>
                  <p className="font-medium">{currentTactic.solution_moves.length}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Source:</span>
                  <p className="font-medium">{currentTactic.source}</p>
                </div>
              </div>

              {/* Explication */}
              <div>
                <span className="text-sm text-gray-600">Explication:</span>
                <p className="mt-1">{currentTactic.explanation}</p>
              </div>

              {/* Visualisation de la tactique */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Visualisation de la solution</h3>
                <TacticPositionViewer
                  initialPosition={currentTactic.position_fen}
                  solutionMoves={currentTactic.solution_moves}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleSave(currentTacticIndex)}
                  disabled={saving || savedTactics.has(currentTacticIndex)}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {savedTactics.has(currentTacticIndex)
                    ? "✓ Sauvegardé"
                    : saving
                    ? "Sauvegarde..."
                    : "Sauvegarder"}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={currentTacticIndex === generatedTactics.length - 1}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Ignorer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

