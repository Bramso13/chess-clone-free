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
  /** Indique si l'ouverture est personnalisée (créée par un utilisateur) */
  is_custom?: boolean;
  /** Identifiant de l'utilisateur qui a créé l'ouverture (pour futur système d'authentification) */
  created_by?: string | null;
}

/**
 * Identifiants des niveaux de difficulté pour Stockfish
 * @deprecated Utiliser DifficultyLevel de @/lib/stockfish/difficultyLevels
 */
export type DifficultyLevelId =
  | "beginner"
  | "casual"
  | "intermediate"
  | "advanced"
  | "expert"
  | "master";

/**
 * Type pour la compatibilité (à supprimer progressivement)
 * @deprecated Utiliser DifficultyLevel de @/lib/stockfish/difficultyLevels
 */
export type DifficultyLevel = DifficultyLevelId;

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

/**
 * Niveau de difficulté pour les problèmes tactiques
 */
export type TacticalDifficulty = "Facile" | "Moyen" | "Difficile";

/**
 * Type de tactique échiquéenne
 */
export type TacticType =
  | "Fourchette"
  | "Clouage"
  | "Enfilade"
  | "Découverte"
  | "Mat"
  | "Gain de matériel"
  | "Double attaque"
  | "Sacrifice";

/**
 * Interface pour un problème tactique
 */
export interface TacticalProblem {
  /** UUID généré par Supabase */
  id: string;
  /** Position initiale en notation FEN */
  position_fen: string;
  /** Séquence de coups solution en notation SAN */
  solution_moves: string[];
  /** Niveau de difficulté */
  difficulty: TacticalDifficulty;
  /** Type de tactique */
  tactic_type: TacticType;
  /** Explication de la solution */
  explanation: string;
  /** Source du problème */
  source?: "manual" | "generated" | "imported";
  /** Date de création */
  created_at: string;
}

/**
 * Nœud d'une variante dans l'arbre de variantes
 */
export interface VariationNode {
  /** Coup menant à ce nœud en notation algébrique */
  move: string;
  /** Position FEN après ce coup */
  fen: string;
  /** Profondeur depuis la position initiale */
  depth: number;
  /** Variantes possibles depuis cette position */
  children: VariationNode[];
}

/**
 * Arbre de variantes généré à partir d'une position
 */
export interface VariationTree {
  /** Position initiale FEN */
  rootFen: string;
  /** Profondeur maximale de l'arbre */
  maxDepth: number;
  /** Tous les nœuds de l'arbre (structure arborescente) */
  nodes: VariationNode[];
}

/**
 * Variante analysée par Stockfish
 */
export interface AnalyzedVariation {
  /** Position analysée (FEN) */
  fen: string;
  /** Séquence de coups jusqu'à cette position */
  moves: string[];
  /** Évaluation en centipawns (positif = avantage blanc) */
  evaluation: number;
  /** Meilleur coup suggéré (format UCI) */
  bestMove: string;
  /** Meilleur coup en notation algébrique */
  bestMoveSan?: string;
  /** Profondeur d'analyse atteinte */
  depth: number;
  /** Temps d'analyse en millisecondes */
  time: number;
  /** Principal variation (ligne recommandée) */
  pv?: string[];
}

/**
 * Options pour l'analyse de variantes
 */
export interface VariationAnalysisOptions {
  /** Profondeur d'analyse Stockfish (défaut: 12) */
  depth?: number;
  /** Temps max par analyse en millisecondes */
  moveTime?: number;
  /** Nombre max d'analyses parallèles (défaut: 3) */
  maxConcurrentAnalyses?: number;
  /** Utiliser cache (défaut: true) */
  useCache?: boolean;
  /** Callback de progression (current, total) */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Indicateur de progression pour l'analyse
 */
export interface AnalysisProgress {
  /** Nombre de variantes analysées */
  current: number;
  /** Nombre total de variantes à analyser */
  total: number;
  /** Pourcentage de progression */
  percentage: number;
}
