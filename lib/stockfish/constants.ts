/**
 * Constantes pour le module Stockfish
 */

import type { DifficultyLevel } from "@/types/chess";

/**
 * Configuration des niveaux de difficulté pour jouer contre Stockfish
 */
export interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  description: string;
  estimatedElo: number;
}

/**
 * Niveaux de difficulté disponibles
 */
export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  {
    id: "beginner",
    name: "Débutant",
    description: "Idéal pour les joueurs qui commencent",
    estimatedElo: 900,
  },
  {
    id: "intermediate",
    name: "Intermédiaire",
    description: "Pour les joueurs avec quelques bases",
    estimatedElo: 1300,
  },
  {
    id: "advanced",
    name: "Avancé",
    description: "Pour les joueurs expérimentés",
    estimatedElo: 1800,
  },
  {
    id: "expert",
    name: "Expert",
    description: "Pour les joueurs de niveau compétitif",
    estimatedElo: 2200,
  },
  {
    id: "master",
    name: "Maître",
    description: "Pour les joueurs de niveau maître",
    estimatedElo: 2600,
  },
];

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

