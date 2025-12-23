/**
 * Composant de configuration pour l'exploration d'ouvertures
 * Permet de configurer la profondeur d'exploration et lancer la génération/analyse
 */

"use client";

import { useState, useEffect } from "react";

export interface ExplorationConfig {
  maxDepth: number;
  maxVariationsPerLevel: number;
  stockfishDepth: number;
}

interface ExplorationConfigurationProps {
  /** Configuration actuelle */
  config: ExplorationConfig;
  /** Callback appelé quand la configuration change */
  onConfigChange: (config: ExplorationConfig) => void;
  /** Callback appelé pour générer les variantes */
  onGenerate: () => void;
  /** Callback appelé pour analyser les variantes */
  onAnalyze: () => void;
  /** Indique si la génération est en cours */
  isGenerating: boolean;
  /** Indique si l'analyse est en cours */
  isAnalyzing: boolean;
  /** Progression de l'analyse */
  analysisProgress: { current: number; total: number } | null;
}

const CONFIG_STORAGE_KEY = "opening-exploration-config";

export function ExplorationConfiguration({
  config,
  onConfigChange,
  onGenerate,
  onAnalyze,
  isGenerating,
  isAnalyzing,
  analysisProgress,
}: ExplorationConfigurationProps) {
  const [localConfig, setLocalConfig] = useState<ExplorationConfig>(config);

  // Charger la configuration sauvegardée au démarrage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalConfig(parsed);
          onConfigChange(parsed);
        } catch (error) {
          console.warn("Erreur lors du chargement de la configuration:", error);
        }
      }
    }
  }, [onConfigChange]);

  // Sauvegarder la configuration quand elle change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(localConfig));
      onConfigChange(localConfig);
    }
  }, [localConfig, onConfigChange]);

  const handleConfigChange = (field: keyof ExplorationConfig, value: number) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const estimateAnalysisTime = (): number => {
    // Estimation très approximative: ~2-5 secondes par position
    const estimatedPositions =
      Math.pow(localConfig.maxVariationsPerLevel, localConfig.maxDepth) * 0.5;
    return Math.ceil(estimatedPositions * 3); // 3 secondes par position en moyenne
  };

  const estimatedTime = estimateAnalysisTime();
  const showWarning = estimatedTime > 30;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profondeur maximale: {localConfig.maxDepth}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={localConfig.maxDepth}
            onChange={(e) =>
              handleConfigChange("maxDepth", parseInt(e.target.value))
            }
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nombre de coups à explorer depuis la position initiale
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variantes max par niveau: {localConfig.maxVariationsPerLevel}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={localConfig.maxVariationsPerLevel}
            onChange={(e) =>
              handleConfigChange(
                "maxVariationsPerLevel",
                parseInt(e.target.value)
              )
            }
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Limite le nombre de branches explorées à chaque niveau
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profondeur analyse Stockfish: {localConfig.stockfishDepth}
          </label>
          <input
            type="range"
            min="8"
            max="20"
            value={localConfig.stockfishDepth}
            onChange={(e) =>
              handleConfigChange("stockfishDepth", parseInt(e.target.value))
            }
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Profondeur de recherche pour l'analyse Stockfish
          </p>
        </div>

        {showWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ Temps d'analyse estimé: ~{estimatedTime} secondes. Cela peut
              prendre du temps.
            </p>
          </div>
        )}

        {analysisProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression de l'analyse</span>
              <span>
                {analysisProgress.current} / {analysisProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    (analysisProgress.current / analysisProgress.total) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onGenerate}
            disabled={isGenerating || isAnalyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Génération..." : "Générer les variantes"}
          </button>
          <button
            onClick={onAnalyze}
            disabled={isGenerating || isAnalyzing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? "Analyse..." : "Analyser avec Stockfish"}
          </button>
        </div>
      </div>
    </div>
  );
}

