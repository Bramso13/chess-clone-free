/**
 * Configuration des niveaux de difficulté pour Stockfish
 * Chaque niveau correspond à une combinaison de paramètres UCI
 * calibrés pour offrir une expérience de jeu appropriée.
 */

import type { StockfishConfig } from "@/types/chess";

/**
 * Interface pour un niveau de difficulté complet
 */
export interface DifficultyLevel {
  /** Identifiant unique du niveau */
  id: string;
  /** Nom affiché à l'utilisateur */
  name: string;
  /** Description détaillée du niveau */
  description: string;
  /** Estimation du niveau Elo approximatif */
  estimatedElo: number;
  /** Configuration Stockfish pour ce niveau */
  stockfishConfig: StockfishConfig;
  /** Recommandation pour quel type de joueur */
  recommendedFor: string;
}

/**
 * Tous les niveaux de difficulté disponibles
 * Calibrés du plus faible (~800 Elo) au plus fort (~2800+ Elo)
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: "beginner",
    name: "Débutant",
    description: "Idéal pour découvrir les échecs et apprendre les bases. Le moteur joue des coups simples et fait parfois des erreurs.",
    estimatedElo: 800,
    stockfishConfig: {
      skillLevel: 1,
      depth: 1,
      moveTime: 100,
    },
    recommendedFor: "Joueurs découvrant les échecs",
  },
  {
    id: "casual",
    name: "Joueur Occasionnel",
    description: "Pour les joueurs connaissant les règles et les principes de base. Le moteur joue de manière cohérente mais reste accessible.",
    estimatedElo: 1100,
    stockfishConfig: {
      skillLevel: 3,
      depth: 3,
      moveTime: 300,
    },
    recommendedFor: "Joueurs avec quelques parties d'expérience",
  },
  {
    id: "intermediate",
    name: "Intermédiaire",
    description: "Pour les joueurs réguliers comprenant les tactiques de base. Le moteur punira les erreurs mais reste défendable.",
    estimatedElo: 1400,
    stockfishConfig: {
      skillLevel: 7,
      depth: 7,
      moveTime: 500,
    },
    recommendedFor: "Joueurs avec des bases solides",
  },
  {
    id: "advanced",
    name: "Avancé",
    description: "Pour les joueurs expérimentés maîtrisant tactiques et stratégie. Le moteur joue des coups forts et variés.",
    estimatedElo: 1800,
    stockfishConfig: {
      skillLevel: 12,
      depth: 12,
      moveTime: 1000,
    },
    recommendedFor: "Joueurs de club",
  },
  {
    id: "expert",
    name: "Expert",
    description: "Pour les joueurs de haut niveau. Le moteur trouve des combinaisons complexes et joue quasi sans erreur.",
    estimatedElo: 2200,
    stockfishConfig: {
      skillLevel: 17,
      depth: 17,
      moveTime: 2000,
    },
    recommendedFor: "Joueurs compétitifs et tournois",
  },
  {
    id: "master",
    name: "Maître",
    description: "Force maximale du moteur. Niveau grand-maître avec analyse profonde. Extrêmement difficile à battre.",
    estimatedElo: 2800,
    stockfishConfig: {
      skillLevel: 20,
      depth: 20,
      moveTime: 3000,
    },
    recommendedFor: "Joueurs de niveau maître et au-delà",
  },
];

/**
 * Obtient un niveau de difficulté par son identifiant
 * @param id - Identifiant du niveau recherché
 * @returns Le niveau correspondant ou undefined si non trouvé
 */
export function getDifficultyLevel(id: string): DifficultyLevel | undefined {
  return DIFFICULTY_LEVELS.find((level) => level.id === id);
}

/**
 * Obtient le niveau de difficulté par défaut (Intermédiaire)
 * @returns Le niveau intermédiaire
 */
export function getDefaultDifficulty(): DifficultyLevel {
  return DIFFICULTY_LEVELS[2]; // Intermediate
}

/**
 * Vérifie si un identifiant de niveau est valide
 * @param id - Identifiant à vérifier
 * @returns true si l'identifiant existe, false sinon
 */
export function isValidDifficultyId(id: string): boolean {
  return DIFFICULTY_LEVELS.some((level) => level.id === id);
}

/**
 * Obtient tous les identifiants de niveaux disponibles
 * @returns Array des IDs de tous les niveaux
 */
export function getAllDifficultyIds(): string[] {
  return DIFFICULTY_LEVELS.map((level) => level.id);
}

/**
 * Obtient le niveau suivant (plus difficile)
 * @param currentId - ID du niveau actuel
 * @returns Le niveau suivant ou undefined si déjà au maximum
 */
export function getNextDifficulty(currentId: string): DifficultyLevel | undefined {
  const currentIndex = DIFFICULTY_LEVELS.findIndex((level) => level.id === currentId);
  if (currentIndex === -1 || currentIndex === DIFFICULTY_LEVELS.length - 1) {
    return undefined;
  }
  return DIFFICULTY_LEVELS[currentIndex + 1];
}

/**
 * Obtient le niveau précédent (plus facile)
 * @param currentId - ID du niveau actuel
 * @returns Le niveau précédent ou undefined si déjà au minimum
 */
export function getPreviousDifficulty(currentId: string): DifficultyLevel | undefined {
  const currentIndex = DIFFICULTY_LEVELS.findIndex((level) => level.id === currentId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return DIFFICULTY_LEVELS[currentIndex - 1];
}

