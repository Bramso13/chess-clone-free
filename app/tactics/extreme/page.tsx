/**
 * Page du mode Extreme d'entraînement en série
 * Affiche la configuration, l'entraînement ou le récapitulatif selon l'état
 */

"use client";

import { useState } from "react";
import { useExtremeMode } from "@/lib/hooks/useExtremeMode";
import type { ExtremeModeConfig } from "@/lib/hooks/useExtremeMode";
import { ExtremeModeConfig as ExtremeModeConfigComponent } from "@/components/tactics/ExtremeModeConfig";
import { ExtremeModeTrainer } from "@/components/tactics/ExtremeModeTrainer";
import { ExtremeModeSummary } from "@/components/tactics/ExtremeModeSummary";
import Link from "next/link";

/**
 * États possibles de la page
 */
type PageState = "config" | "training" | "summary";

/**
 * Page du mode Extreme
 */
export default function ExtremeModePage() {
  const [pageState, setPageState] = useState<PageState>("config");
  const [savedConfig, setSavedConfig] = useState<ExtremeModeConfig | null>(
    null
  );
  const extremeMode = useExtremeMode();

  /**
   * Gérer le démarrage de l'entraînement
   */
  const handleStart = async (config: ExtremeModeConfig) => {
    setSavedConfig(config);
    try {
      await extremeMode.start(config);
      setPageState("training");
    } catch (error) {
      console.error("Erreur lors du démarrage:", error);
      alert(
        "Erreur lors du démarrage de l'entraînement. Veuillez réessayer."
      );
    }
  };

  /**
   * Gérer l'arrêt de l'entraînement
   */
  const handleStop = () => {
    extremeMode.stop();
    setPageState("summary");
  };

  /**
   * Gérer le retour à la configuration
   */
  const handleBackToConfig = () => {
    setPageState("config");
    setSavedConfig(null);
  };

  /**
   * Gérer le redémarrage avec les mêmes filtres
   */
  const handleRestart = async () => {
    if (savedConfig) {
      try {
        await extremeMode.start(savedConfig);
        setPageState("training");
      } catch (error) {
        console.error("Erreur lors du redémarrage:", error);
        alert("Erreur lors du redémarrage. Veuillez réessayer.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête avec navigation */}
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
            Retour aux tactiques
          </Link>

          {/* Badge Mode Extreme */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              ⚡ Mode Extreme
            </span>
          </div>
        </div>

        {/* Contenu selon l'état */}
        {pageState === "config" && (
          <ExtremeModeConfigComponent
            onStart={handleStart}
            isLoading={extremeMode.state.isLoading}
          />
        )}

        {pageState === "training" && (
          <ExtremeModeTrainer
            extremeMode={extremeMode}
            nextProblemDelayMs={savedConfig?.nextProblemDelayMs || 2500}
            onProblemSolved={() => {
              // Géré automatiquement par ExtremeModeTrainer
            }}
            onProblemFailed={() => {
              // Géré automatiquement par ExtremeModeTrainer
            }}
            onStop={handleStop}
          />
        )}

        {pageState === "summary" && (
          <ExtremeModeSummary
            stats={extremeMode.state.stats}
            onRestart={handleRestart}
            onBack={handleBackToConfig}
          />
        )}
      </div>
    </div>
  );
}

