/**
 * Types TypeScript pour les composants d'échecs
 * Définit les interfaces et types pour l'échiquier et la logique de jeu
 */

// Type pour les cases d'échiquier (notation algébrique)
export type Square =
  | "a1"
  | "a2"
  | "a3"
  | "a4"
  | "a5"
  | "a6"
  | "a7"
  | "a8"
  | "b1"
  | "b2"
  | "b3"
  | "b4"
  | "b5"
  | "b6"
  | "b7"
  | "b8"
  | "c1"
  | "c2"
  | "c3"
  | "c4"
  | "c5"
  | "c6"
  | "c7"
  | "c8"
  | "d1"
  | "d2"
  | "d3"
  | "d4"
  | "d5"
  | "d6"
  | "d7"
  | "d8"
  | "e1"
  | "e2"
  | "e3"
  | "e4"
  | "e5"
  | "e6"
  | "e7"
  | "e8"
  | "f1"
  | "f2"
  | "f3"
  | "f4"
  | "f5"
  | "f6"
  | "f7"
  | "f8"
  | "g1"
  | "g2"
  | "g3"
  | "g4"
  | "g5"
  | "g6"
  | "g7"
  | "g8"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "h7"
  | "h8";

/**
 * Interface pour représenter un coup
 */
export interface Move {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n"; // Promotion de pion
}

/**
 * Props du composant Chessboard
 */
export interface ChessboardProps {
  /** Position FEN de l'échiquier */
  position: string;
  /** Callback appelé quand un coup valide est joué */
  onMove?: (move: Move) => void;
  /** Si true, l'échiquier est interactif (défaut: true) */
  interactive?: boolean;
  /** Si true, affiche les coups légaux (défaut: false) */
  showLegalMoves?: boolean;
  /** Orientation de l'échiquier (défaut: 'white') */
  boardOrientation?: "white" | "black";
}

/**
 * État interne du composant Chessboard (si nécessaire)
 */
export interface ChessboardState {
  /** Position FEN actuelle */
  position: string;
  /** Coups légaux possibles */
  legalMoves: Move[];
  /** Si un coup est en cours de validation */
  isValidating: boolean;
}

/**
 * Interface pour les variantes d'ouvertures
 */
export interface OpeningVariation {
  /** Nom de la variante */
  name: string;
  /** Séquence de coups en notation algébrique */
  moves: string[];
}

/**
 * Interface pour les ouvertures d'échecs
 */
export interface Opening {
  /** UUID généré par Supabase */
  id: string;
  /** Nom de l'ouverture (ex: "Ruy Lopez") */
  name: string;
  /** Code ECO (ex: "C70") */
  eco_code: string;
  /** Séquence de coups en notation algébrique */
  moves: string[];
  /** Variantes de l'ouverture */
  variations: OpeningVariation[];
  /** Description optionnelle */
  description?: string;
  /** Côté du joueur (blancs ou noirs) */
  player_side: "white" | "black";
  /** Date de création */
  created_at: string;
}

/**
 * Niveaux de difficulté pour Stockfish
 */
export type DifficultyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "master";

/**
 * Configuration pour l'analyse Stockfish
 */
export interface StockfishConfig {
  /** Niveau de skill (0-20) */
  skillLevel: number;
  /** Profondeur de recherche */
  depth: number;
  /** Temps de réflexion en millisecondes */
  moveTime?: number;
}

/**
 * Options pour l'analyse de position
 */
export interface AnalysisOptions {
  /** Profondeur de recherche (défaut: 10) */
  depth?: number;
  /** Temps maximum en millisecondes */
  moveTime?: number;
  /** Nombre de lignes d'analyse (défaut: 1) */
  multiPv?: number;
}

/**
 * Résultat de l'analyse Stockfish
 */
export interface AnalysisResult {
  /** Meilleur coup en format UCI (ex: "e2e4") */
  bestMove: string;
  /** Évaluation en centipawns (positif = avantage blanc) */
  evaluation?: number;
  /** Profondeur de recherche atteinte */
  depth: number;
  /** Temps d'analyse en millisecondes */
  time: number;
  /** Séquence de coups recommandés */
  pv?: string[];
}

/**
 * Interface pour le moteur Stockfish (Web Worker)
 */
export interface StockfishEngine {
  /** Envoyer une commande UCI au moteur */
  postMessage(command: string): void;
  /** Gestionnaire de messages reçus du moteur */
  onmessage: ((event: MessageEvent) => void) | null;
  /** Terminer le moteur */
  terminate(): void;
}

/**
 * Couleur du joueur dans une partie
 */
export type PlayerColor = "white" | "black" | "random";

/**
 * Configuration d'une partie contre Stockfish
 */
export interface GameConfiguration {
  /** Niveau de difficulté */
  difficulty: DifficultyLevel;
  /** Couleur du joueur (blancs, noirs, ou aléatoire) */
  playerColor: PlayerColor;
}
