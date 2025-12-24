/**
 * Hook pour gérer le mode Extreme d'entraînement en série
 * Gère la sélection aléatoire des problèmes, le passage automatique, et les statistiques
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { TacticalProblem, TacticalDifficulty, TacticType } from "@/types/chess";
import {
  getTacticalProblemsByFilter,
  type FilterOptions,
} from "@/lib/services/tacticsService";

/**
 * Options de configuration pour le mode Extreme
 */
export interface ExtremeModeConfig {
  /** Filtre par difficulté */
  difficulty?: TacticalDifficulty;
  /** Filtre par type de tactique */
  tacticType?: TacticType;
  /** Filtre par source */
  source?: "manual" | "generated" | "imported";
  /** Délai en millisecondes avant passage au problème suivant (défaut: 2500) */
  nextProblemDelayMs?: number;
}

/**
 * Statistiques de la session Extreme
 */
export interface ExtremeModeStats {
  /** Nombre de problèmes résolus */
  solved: number;
  /** Nombre de problèmes échoués */
  failed: number;
  /** Nombre total de problèmes tentés */
  attempted: number;
  /** Temps total écoulé en millisecondes */
  totalTimeMs: number;
  /** Temps de début de la session */
  startTime: number;
  /** Taux de réussite en pourcentage */
  successRate: number;
  /** Temps moyen par problème résolu en millisecondes */
  averageTimePerProblem: number;
}

/**
 * État du mode Extreme
 */
export interface ExtremeModeState {
  /** Problème actuel */
  currentProblem: TacticalProblem | null;
  /** Index du problème actuel */
  currentIndex: number;
  /** Liste de tous les problèmes disponibles (pool) */
  availableProblems: TacticalProblem[];
  /** Liste des problèmes déjà utilisés (pour éviter répétitions) */
  usedProblemIds: Set<string>;
  /** Statistiques de la session */
  stats: ExtremeModeStats;
  /** Indique si le mode est en pause */
  isPaused: boolean;
  /** Indique si la session est terminée */
  isFinished: boolean;
  /** Indique si le mode est en cours de chargement */
  isLoading: boolean;
}

/**
 * Résultat du hook useExtremeMode
 */
export interface UseExtremeModeResult {
  /** État actuel */
  state: ExtremeModeState;
  /** Fonction pour démarrer le mode Extreme */
  start: (config: ExtremeModeConfig) => Promise<void>;
  /** Fonction pour passer au problème suivant */
  nextProblem: () => Promise<void>;
  /** Fonction pour marquer le problème actuel comme résolu */
  markSolved: () => void;
  /** Fonction pour marquer le problème actuel comme échoué */
  markFailed: () => void;
  /** Fonction pour mettre en pause / reprendre */
  togglePause: () => void;
  /** Fonction pour arrêter la session */
  stop: () => void;
  /** Fonction pour réinitialiser les statistiques */
  resetStats: () => void;
}

/**
 * Hook pour gérer le mode Extreme
 */
export function useExtremeMode(): UseExtremeModeResult {
  const [state, setState] = useState<ExtremeModeState>(() => ({
    currentProblem: null,
    currentIndex: 0,
    availableProblems: [],
    usedProblemIds: new Set(),
    stats: {
      solved: 0,
      failed: 0,
      attempted: 0,
      totalTimeMs: 0,
      startTime: Date.now(),
      successRate: 0,
      averageTimePerProblem: 0,
    },
    isPaused: false,
    isFinished: false,
    isLoading: false,
  }));

  // Références pour gérer les timeouts
  const nextProblemTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const problemStartTimeRef = useRef<number>(0);

  /**
   * Charger les problèmes selon les filtres
   */
  const loadProblems = useCallback(async (config: ExtremeModeConfig) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const filterOptions: FilterOptions = {
        difficulty: config.difficulty,
        tacticType: config.tacticType,
        source: config.source,
      };

      const problems = await getTacticalProblemsByFilter(filterOptions);

      if (problems.length === 0) {
        throw new Error("Aucun problème disponible avec ces filtres");
      }

      // Mélanger aléatoirement les problèmes
      const shuffled = [...problems].sort(() => Math.random() - 0.5);

      setState((prev) => ({
        ...prev,
        availableProblems: shuffled,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des problèmes:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  /**
   * Sélectionner un problème aléatoire depuis la pool disponible
   */
  const selectRandomProblem = useCallback(
    (currentState: ExtremeModeState): TacticalProblem | null => {
      // Si tous les problèmes ont été utilisés, réinitialiser la liste des utilisés
      let usedIds = currentState.usedProblemIds;
      if (usedIds.size >= currentState.availableProblems.length) {
        usedIds = new Set();
      }

      // Trouver les problèmes non utilisés
      const unusedProblems = currentState.availableProblems.filter(
        (p) => !usedIds.has(p.id)
      );

      if (unusedProblems.length === 0) {
        return null;
      }

      // Sélectionner un problème aléatoire
      const randomIndex = Math.floor(Math.random() * unusedProblems.length);
      return unusedProblems[randomIndex];
    },
    []
  );

  /**
   * Mettre à jour les statistiques
   */
  const updateStats = useCallback(
    (solved: boolean) => {
      setState((prev) => {
        const now = Date.now();
        const problemTime = now - problemStartTimeRef.current;
        const newTotalTime = prev.stats.totalTimeMs + problemTime;

        const newSolved = solved ? prev.stats.solved + 1 : prev.stats.solved;
        const newFailed = solved ? prev.stats.failed : prev.stats.failed + 1;
        const newAttempted = prev.stats.attempted + 1;

        const successRate =
          newAttempted > 0 ? (newSolved / newAttempted) * 100 : 0;
        const averageTimePerProblem =
          newSolved > 0 ? newTotalTime / newSolved : 0;

        return {
          ...prev,
          stats: {
            solved: newSolved,
            failed: newFailed,
            attempted: newAttempted,
            totalTimeMs: newTotalTime,
            startTime: prev.stats.startTime,
            successRate,
            averageTimePerProblem,
          },
        };
      });
    },
    []
  );

  /**
   * Démarrer le mode Extreme
   */
  const start = useCallback(
    async (config: ExtremeModeConfig) => {
      // Nettoyer les timeouts précédents
      if (nextProblemTimeoutRef.current) {
        clearTimeout(nextProblemTimeoutRef.current);
        nextProblemTimeoutRef.current = null;
      }

      await loadProblems(config);

      // Attendre que les problèmes soient chargés
      setState((prev) => {
        if (prev.availableProblems.length === 0) {
          return prev;
        }

        const selectedProblem = selectRandomProblem(prev);
        return {
          ...prev,
          currentProblem: selectedProblem,
          currentIndex: 1,
          usedProblemIds: selectedProblem
            ? new Set([selectedProblem.id])
            : new Set(),
          isPaused: false,
          isFinished: false,
          stats: {
            solved: 0,
            failed: 0,
            attempted: 0,
            totalTimeMs: 0,
            startTime: Date.now(),
            successRate: 0,
            averageTimePerProblem: 0,
          },
        };
      });

      problemStartTimeRef.current = Date.now();
    },
    [loadProblems, selectRandomProblem]
  );

  /**
   * Passer au problème suivant
   */
  const nextProblem = useCallback(async () => {
    // Nettoyer le timeout précédent
    if (nextProblemTimeoutRef.current) {
      clearTimeout(nextProblemTimeoutRef.current);
      nextProblemTimeoutRef.current = null;
    }

    setState((prev) => {
      const selectedProblem = selectRandomProblem(prev);
      if (!selectedProblem) {
        return prev;
      }

      // Si tous les problèmes ont été utilisés, réinitialiser
      let newUsedIds = prev.usedProblemIds;
      if (newUsedIds.size >= prev.availableProblems.length) {
        newUsedIds = new Set();
      }

      return {
        ...prev,
        currentProblem: selectedProblem,
        currentIndex: prev.currentIndex + 1,
        usedProblemIds: new Set([...newUsedIds, selectedProblem.id]),
      };
    });

    problemStartTimeRef.current = Date.now();
  }, [selectRandomProblem]);

  /**
   * Marquer le problème actuel comme résolu
   */
  const markSolved = useCallback(() => {
    updateStats(true);
    problemStartTimeRef.current = Date.now();
  }, [updateStats]);

  /**
   * Marquer le problème actuel comme échoué
   */
  const markFailed = useCallback(() => {
    updateStats(false);
    problemStartTimeRef.current = Date.now();
  }, [updateStats]);

  /**
   * Mettre en pause / reprendre
   */
  const togglePause = useCallback(() => {
    setState((prev) => {
      const newIsPaused = !prev.isPaused;

      // Si on reprend, mettre à jour le temps de début du problème
      if (!newIsPaused) {
        problemStartTimeRef.current = Date.now();
      }

      return {
        ...prev,
        isPaused: newIsPaused,
      };
    });
  }, []);

  /**
   * Arrêter la session
   */
  const stop = useCallback(() => {
    // Nettoyer les timeouts
    if (nextProblemTimeoutRef.current) {
      clearTimeout(nextProblemTimeoutRef.current);
      nextProblemTimeoutRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isFinished: true,
      isPaused: false,
    }));
  }, []);

  /**
   * Réinitialiser les statistiques
   */
  const resetStats = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stats: {
        solved: 0,
        failed: 0,
        attempted: 0,
        totalTimeMs: 0,
        startTime: Date.now(),
        successRate: 0,
        averageTimePerProblem: 0,
      },
    }));
  }, []);

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      if (nextProblemTimeoutRef.current) {
        clearTimeout(nextProblemTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    start,
    nextProblem,
    markSolved,
    markFailed,
    togglePause,
    stop,
    resetStats,
  };
}

