/**
 * Hook pour gérer les préférences utilisateur
 * Stocke les préférences dans localStorage pour persistance
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Interface pour les préférences utilisateur
 */
export interface UserPreferences {
  /** Annulation automatique des coups incorrects (défaut: true) */
  autoUndoIncorrectMoves: boolean;
  /** Délai avant annulation automatique en millisecondes (défaut: 1250) */
  autoUndoDelayMs: number;
}

/**
 * Clé pour localStorage
 */
const STORAGE_KEY = "chess-clone-user-preferences";

/**
 * Préférences par défaut
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  autoUndoIncorrectMoves: true,
  autoUndoDelayMs: 1250,
};

/**
 * Charge les préférences depuis localStorage
 */
function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement des préférences:", error);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Sauvegarde les préférences dans localStorage
 */
function savePreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des préférences:", error);
  }
}

/**
 * Hook pour gérer les préférences utilisateur
 * @returns Préférences et fonctions pour les modifier
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    loadPreferences()
  );

  // Charger les préférences au montage
  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  /**
   * Met à jour une préférence spécifique
   */
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K]
    ) => {
      setPreferences((prev) => {
        const updated = { ...prev, [key]: value };
        savePreferences(updated);
        return updated;
      });
    },
    []
  );

  /**
   * Met à jour plusieurs préférences à la fois
   */
  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const updated = { ...prev, ...updates };
        savePreferences(updated);
        return updated;
      });
    },
    []
  );

  /**
   * Réinitialise les préférences aux valeurs par défaut
   */
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
  };
}

