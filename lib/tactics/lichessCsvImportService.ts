/**
 * Service d'import CSV pour les puzzles tactiques Lichess
 * Parse et transforme les données CSV en format TacticalProblem
 */

import Papa from "papaparse";
import { Chess } from "chess.js";
import type { TacticalProblem, TacticalDifficulty, TacticType } from "@/types/chess";

/**
 * Structure d'une ligne CSV Lichess
 */
export interface LichessCsvRow {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: string;
  RatingDeviation?: string;
  Popularity?: string;
  NbPlays?: string;
  themes: string;
  GameUrl?: string;
  OpeningTags?: string;
}

/**
 * Erreur d'import avec détails
 */
export interface ImportError {
  /** Numéro de ligne dans le CSV (1-based, header = ligne 0) */
  line: number;
  /** Message d'erreur descriptif */
  message: string;
  /** Données de la ligne qui a causé l'erreur */
  row?: LichessCsvRow;
}

/**
 * Avertissement d'import (données manquantes ou suspectes mais non bloquantes)
 */
export interface ImportWarning {
  /** Numéro de ligne dans le CSV */
  line: number;
  /** Message d'avertissement */
  message: string;
  /** Données de la ligne concernée */
  row?: LichessCsvRow;
}

/**
 * Rapport d'import avec statistiques et détails
 */
export interface ImportReport {
  /** Nombre total de lignes traitées (hors header) */
  total: number;
  /** Nombre de puzzles parsés avec succès */
  success: number;
  /** Nombre d'erreurs bloquantes */
  errors: number;
  /** Nombre d'avertissements (non bloquants) */
  warnings: number;
  /** Liste des erreurs détaillées */
  errorDetails: ImportError[];
  /** Liste des avertissements */
  warningDetails: ImportWarning[];
}

/**
 * Problème tactique parsé depuis le CSV (avant transformation complète)
 */
export interface ParsedTacticalProblem {
  /** Position FEN */
  position_fen: string;
  /** Séquence de coups solution en notation SAN */
  solution_moves: string[];
  /** Niveau de difficulté */
  difficulty: TacticalDifficulty;
  /** Type de tactique */
  tactic_type: TacticType;
  /** Explication de la solution */
  explanation: string;
  /** Métadonnées additionnelles (rating Lichess, etc.) */
  metadata?: {
    lichess_rating?: number;
    lichess_puzzle_id?: string;
    popularity?: number;
    nb_plays?: number;
    game_url?: string;
    opening_tags?: string;
  };
}

/**
 * Résultat du parsing CSV
 */
export interface ParseResult {
  /** Puzzles parsés avec succès */
  problems: ParsedTacticalProblem[];
  /** Rapport d'import */
  report: ImportReport;
}

/**
 * Convertit un rating Lichess en niveau de difficulté
 * @param rating - Rating numérique de Lichess
 * @returns Niveau de difficulté correspondant
 */
/**
 * Convertit un rating Lichess en niveau de difficulté
 * Seuils: < 1400 = Facile, 1400-1799 = Moyen, >= 1800 = Difficile
 */
function convertRatingToDifficulty(rating: number): TacticalDifficulty {
  if (rating < 1400) {
    return "Facile";
  } else if (rating >= 1400 && rating < 1800) {
    return "Moyen";
  } else {
    return "Difficile";
  }
}

/**
 * Parse une séquence de coups UCI en notation SAN
 * @param movesString - Chaîne de coups séparés par des espaces (format UCI: "e2e4 e7e5")
 * @param fen - Position FEN initiale
 * @returns Tableau de coups en notation SAN
 */
function parseUciMovesToSan(movesString: string, fen: string): string[] {
  const moves = movesString.trim().split(/\s+/).filter((m) => m.length > 0);
  const game = new Chess(fen);
  const sanMoves: string[] = [];

  for (const uciMove of moves) {
    try {
      const move = game.move({
        from: uciMove.substring(0, 2) as any,
        to: uciMove.substring(2, 4) as any,
        promotion: uciMove.length > 4 ? (uciMove[4] as "q" | "r" | "b" | "n") : undefined,
      });

      if (move) {
        sanMoves.push(move.san);
      } else {
        throw new Error(`Coup UCI invalide: ${uciMove}`);
      }
    } catch (error) {
      throw new Error(`Erreur lors du parsing du coup ${uciMove}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  }

  return sanMoves;
}

/**
 * Mapping des themes Lichess vers nos types de tactiques
 */
const THEME_TO_TACTIC_TYPE_MAP: Record<string, TacticType> = {
  fork: "Fourchette",
  pin: "Clouage",
  skewer: "Enfilade",
  discoveredAttack: "Découverte",
  doubleCheck: "Double attaque",
  mate: "Mat",
  mateIn1: "Mat",
  mateIn2: "Mat",
  mateIn3: "Mat",
  mateIn4: "Mat",
  mateIn5: "Mat",
  endgame: "Gain de matériel",
  short: "Gain de matériel",
  veryLong: "Gain de matériel",
  sacrifice: "Sacrifice",
  deflection: "Découverte",
  quietMove: "Gain de matériel",
  equality: "Gain de matériel",
  crushing: "Gain de matériel",
  advancedPawn: "Gain de matériel",
  hangingPiece: "Gain de matériel",
  backRankMate: "Mat",
  intermezzo: "Découverte",
};

/**
 * Extrait et mappe le type de tactique principal depuis les themes Lichess
 * @param themesString - Chaîne de themes séparés par des virgules ou autres délimiteurs
 * @returns Type de tactique mappé, ou "Gain de matériel" par défaut
 */
function extractTacticType(themesString: string): TacticType {
  if (!themesString || themesString.trim().length === 0) {
    return "Gain de matériel";
  }

  // Parser les themes (peuvent être séparés par virgules, espaces, pipes, etc.)
  const themes = themesString
    .split(/[,|\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  // Chercher le premier theme connu
  for (const theme of themes) {
    if (THEME_TO_TACTIC_TYPE_MAP[theme]) {
      return THEME_TO_TACTIC_TYPE_MAP[theme];
    }
  }

  // Par défaut, retourner "Gain de matériel"
  return "Gain de matériel";
}

/**
 * Génère une explication basique basée sur le type de tactique
 * @param tacticType - Type de tactique
 * @param movesCount - Nombre de coups dans la solution
 * @returns Explication générée
 */
function generateExplanation(tacticType: TacticType, movesCount: number): string {
  const explanations: Record<TacticType, string> = {
    Fourchette: "Trouvez la fourchette qui attaque deux pièces adverses simultanément.",
    Clouage: "Trouvez le clouage qui immobilise une pièce ennemie.",
    Enfilade: "Trouvez l'enfilade qui force une pièce importante à bouger.",
    Découverte: "Trouvez l'attaque à la découverte qui révèle une menace.",
    Mat: `Trouvez la séquence de ${movesCount} coup${movesCount > 1 ? "s" : ""} menant au mat.`,
    "Gain de matériel": `Trouvez la séquence de ${movesCount} coup${movesCount > 1 ? "s" : ""} qui permet de gagner du matériel.`,
    "Double attaque": "Trouvez la double attaque qui crée deux menaces simultanées.",
    Sacrifice: "Trouvez le sacrifice qui permet d'obtenir un avantage décisif.",
  };

  return explanations[tacticType] || `Trouvez la meilleure séquence de ${movesCount} coup${movesCount > 1 ? "s" : ""}.`;
}

/**
 * Transforme une ligne CSV en problème tactique parsé
 * @param row - Ligne CSV parsée
 * @param lineNumber - Numéro de ligne (pour les erreurs)
 * @returns Problème parsé ou erreur
 */
export function transformCsvRowToTacticalProblem(
  row: LichessCsvRow,
  lineNumber: number
): { problem?: ParsedTacticalProblem; error?: ImportError } {
  // Valider les colonnes essentielles
  if (!row.PuzzleId || !row.FEN || !row.Moves || !row.Rating) {
    return {
      error: {
        line: lineNumber,
        message: "Colonnes essentielles manquantes (PuzzleId, FEN, Moves, Rating)",
        row,
      },
    };
  }

  // Parser le rating
  const rating = parseInt(row.Rating, 10);
  if (isNaN(rating)) {
    return {
      error: {
        line: lineNumber,
        message: `Rating invalide: ${row.Rating}`,
        row,
      },
    };
  }

  // Convertir le rating en difficulté
  const difficulty = convertRatingToDifficulty(rating);

  // Parser les coups UCI vers SAN
  let solutionMoves: string[];
  try {
    solutionMoves = parseUciMovesToSan(row.Moves, row.FEN);
    if (solutionMoves.length === 0) {
      return {
        error: {
          line: lineNumber,
          message: "Aucun coup valide dans la séquence Moves",
          row,
        },
      };
    }
  } catch (error) {
    return {
      error: {
        line: lineNumber,
        message: error instanceof Error ? error.message : "Erreur lors du parsing des coups",
        row,
      },
    };
  }

  // Extraire le type de tactique
  const tacticType = extractTacticType(row.themes || "");

  // Générer l'explication
  const explanation = generateExplanation(tacticType, solutionMoves.length);

  // Construire les métadonnées
  const metadata: ParsedTacticalProblem["metadata"] = {
    lichess_rating: rating,
    lichess_puzzle_id: row.PuzzleId,
  };

  if (row.Popularity) {
    const popularity = parseInt(row.Popularity, 10);
    if (!isNaN(popularity)) {
      metadata.popularity = popularity;
    }
  }

  if (row.NbPlays) {
    const nbPlays = parseInt(row.NbPlays, 10);
    if (!isNaN(nbPlays)) {
      metadata.nb_plays = nbPlays;
    }
  }

  if (row.GameUrl) {
    metadata.game_url = row.GameUrl;
  }

  if (row.OpeningTags) {
    metadata.opening_tags = row.OpeningTags;
  }

  return {
    problem: {
      position_fen: row.FEN,
      solution_moves: solutionMoves,
      difficulty,
      tactic_type: tacticType,
      explanation,
      metadata,
    },
  };
}

/**
 * Parse un fichier CSV Lichess et retourne les problèmes tactiques
 * @param csvContent - Contenu du fichier CSV en chaîne
 * @returns Résultat du parsing avec problèmes et rapport
 */
export function parseLichessCsv(csvContent: string): ParseResult {
  const report: ImportReport = {
    total: 0,
    success: 0,
    errors: 0,
    warnings: 0,
    errorDetails: [],
    warningDetails: [],
  };

  const problems: ParsedTacticalProblem[] = [];

  // Parser le CSV avec PapaParse
  const parseResult = Papa.parse<LichessCsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      // Normaliser les en-têtes (gérer les espaces, casse, etc.)
      return header.trim();
    },
  });

  // Vérifier les erreurs de parsing PapaParse
  if (parseResult.errors.length > 0) {
    for (const error of parseResult.errors) {
      report.errors++;
      report.errorDetails.push({
        line: error.row !== undefined ? error.row + 2 : 0, // +2 car header = ligne 1, première ligne de données = ligne 2
        message: `Erreur de parsing CSV: ${error.message}`,
      });
    }
  }

  // Traiter chaque ligne de données
  report.total = parseResult.data.length;

  for (let i = 0; i < parseResult.data.length; i++) {
    const row = parseResult.data[i];
    const lineNumber = i + 2; // +2 car header = ligne 1, première ligne = ligne 2

    // Ignorer les lignes vides
    if (!row || Object.keys(row).length === 0) {
      continue;
    }

    // Transformer la ligne en problème tactique
    const result = transformCsvRowToTacticalProblem(row, lineNumber);

    if (result.error) {
      report.errors++;
      report.errorDetails.push(result.error);
    } else if (result.problem) {
      report.success++;
      problems.push(result.problem);
    }
  }

  return {
    problems,
    report,
  };
}

