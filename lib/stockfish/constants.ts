/**
 * Constantes pour le module Stockfish
 * Ce fichier réexporte les niveaux depuis difficultyLevels.ts pour compatibilité UI
 */

import type { DifficultyLevel as DifficultyLevelId } from "@/types/chess";
import { DIFFICULTY_LEVELS as FULL_DIFFICULTY_LEVELS } from "./difficultyLevels";

/**
 * Configuration des niveaux de difficulté pour l'interface utilisateur
 * @deprecated Utiliser DifficultyLevel depuis ./difficultyLevels pour la logique métier
 */
export interface DifficultyConfig {
  id: DifficultyLevelId;
  name: string;
  description: string;
  estimatedElo: number;
  recommendedFor?: string;
}

/**
 * Niveaux de difficulté disponibles pour l'UI
 * Réexportés depuis difficultyLevels.ts avec format simplifié
 */
export const DIFFICULTY_LEVELS: DifficultyConfig[] = FULL_DIFFICULTY_LEVELS.map(
  (level) => ({
    id: level.id as DifficultyLevelId,
    name: level.name,
    description: level.description,
    estimatedElo: level.estimatedElo,
    recommendedFor: level.recommendedFor,
  })
);

/**
 * Réexporter le type et les fonctions utilitaires pour accès facile
 */
export type { DifficultyLevel } from "./difficultyLevels";
export {
  getDifficultyLevel,
  getDefaultDifficulty,
  isValidDifficultyId,
  getAllDifficultyIds,
} from "./difficultyLevels";

/**
 * Options de couleur pour le joueur
 */
export const COLOR_OPTIONS = [
  {
    id: "white",
    name: "Blancs",
    description: "Je joue avec les pièces blanches",
  },
  {
    id: "black",
    name: "Noirs",
    description: "Je joue avec les pièces noires",
  },
  {
    id: "random",
    name: "Aléatoire",
    description: "Couleur choisie au hasard",
  },
] as const;

