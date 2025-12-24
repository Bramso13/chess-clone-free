/**
 * Composant d'entraînement pour le mode Extreme
 * Affiche le problème actuel avec les statistiques en temps réel
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { ProblemSolver } from "./ProblemSolver";
import type { TacticalProblem } from "@/types/chess";
import type { UseExtremeModeResult } from "@/lib/hooks/useExtremeMode";

interface ExtremeModeTrainerProps {
  /** Hook du mode Extreme */
  extremeMode: UseExtremeModeResult;
  /** Délai avant passage au problème suivant en millisecondes */
  nextProblemDelayMs?: number;
  /** Callback appelé quand un problème est résolu */
  onProblemSolved?: () => void;
  /** Callback appelé quand un problème est échoué */
  onProblemFailed?: () => void;
  /** Callback appelé quand l'utilisateur arrête la session */
  onStop?: () => void;
}

/**
 * Formatage du temps en minutes:secondes
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Composant ExtremeModeTrainer
 */
export function ExtremeModeTrainer({
  extremeMode,
  nextProblemDelayMs = 2500,
  onProblemSolved,
  onProblemFailed,
  onStop,
}: ExtremeModeTrainerProps) {
  const { state, markSolved, markFailed, nextProblem, togglePause, stop } =
    extremeMode;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const problemSolvedRef = useRef<string | null>(null);

  // Mettre à jour le temps écoulé
  useEffect(() => {
    if (state.isPaused || state.isFinished) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - state.stats.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isPaused, state.isFinished, state.stats.startTime]);

  // Réinitialiser le flag quand le problème change
  useEffect(() => {
    problemSolvedRef.current = null;
  }, [state.currentProblem?.id]);

  // Gérer la résolution du problème
  const handleProblemComplete = () => {
    // Éviter les appels multiples pour le même problème
    if (
      !state.currentProblem ||
      problemSolvedRef.current === state.currentProblem.id
    ) {
      return;
    }

    problemSolvedRef.current = state.currentProblem.id;
    markSolved();
    onProblemSolved?.();

    // Passer au problème suivant après délai
    setIsTransitioning(true);
    setTimeout(() => {
      nextProblem();
      setIsTransitioning(false);
    }, nextProblemDelayMs);
  };

  if (!state.currentProblem) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Chargement du problème...</p>
        </div>
      </div>
    );
  }

  if (state.isPaused) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            En pause
          </h2>
          <p className="text-gray-600 text-center mb-6">
            L'entraînement est en pause. Cliquez sur "Reprendre" pour continuer.
          </p>
          <div className="flex gap-4">
            <button
              onClick={togglePause}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Reprendre
            </button>
            <button
              onClick={stop}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Arrêter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Statistiques en temps réel */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Problème actuel */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Problème</div>
            <div className="text-2xl font-bold text-gray-900">
              #{state.currentIndex}
            </div>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {state.stats.solved} / {state.stats.attempted}
            </div>
          </div>

          {/* Taux de réussite */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Réussite</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(state.stats.successRate)}%
            </div>
          </div>

          {/* Temps écoulé */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Temps</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Message de transition */}
      {isTransitioning && (
        <div className="bg-green-50 rounded-lg border-2 border-green-300 p-4 mb-6 text-center">
          <p className="text-green-800 font-semibold">
            Problème résolu ! Prochain dans quelques secondes...
          </p>
        </div>
      )}

      {/* Interface de résolution */}
      <div className={isTransitioning ? "opacity-50 pointer-events-none" : ""}>
        <ProblemSolver
          problem={state.currentProblem}
          previousProblemId={null}
          nextProblemId={null}
          onComplete={handleProblemComplete}
        />
      </div>

      {/* Boutons de contrôle */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={togglePause}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Pause
        </button>
        <button
          onClick={() => {
            stop();
            onStop?.();
          }}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          Arrêter
        </button>
      </div>
    </div>
  );
}

