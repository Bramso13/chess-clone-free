/**
 * Service de validation et transformation des données de puzzles Lichess
 * Valide les puzzles importés avant insertion dans la base de données
 */

import { ChessService, InvalidFenError, InvalidMoveError } from "@/lib/chess/chessService";
import { Chess } from "chess.js";
import type {
  TacticalProblem,
  TacticalDifficulty,
  TacticType,
} from "@/types/chess";
import type {
  ParsedTacticalProblem,
} from "./lichessCsvImportService";

/**
 * Résultat de validation d'un puzzle individuel
 */
export interface ValidationResult {
  /** Indique si le puzzle est valide */
  isValid: boolean;
  /** Message d'erreur si invalide */
  error?: string;
  /** Avertissements (non bloquants) */
  warnings?: string[];
  /** Puzzle validé (si valide) */
  problem?: TacticalProblem;
}

/**
 * Rapport de validation par lot
 */
export interface ValidationReport {
  /** Nombre total de puzzles validés */
  total: number;
  /** Nombre de puzzles valides */
  valid: number;
  /** Nombre de puzzles invalides */
  invalid: number;
  /** Nombre de puzzles avec avertissements */
  withWarnings: number;
  /** Détails des erreurs */
  errors: Array<{ puzzle: ParsedTacticalProblem; error: string }>;
  /** Détails des avertissements */
  warnings: Array<{ puzzle: ParsedTacticalProblem; warning: string }>;
}

/**
 * Convertisseur de rating Lichess vers difficulté
 * Même logique que dans le service d'import
 */
function convertLichessRatingToDifficulty(rating: number): TacticalDifficulty {
  if (rating < 1400) {
    return "Facile";
  } else if (rating >= 1400 && rating < 1800) {
    return "Moyen";
  } else {
    return "Difficile";
  }
}

/**
 * Valide une position FEN
 * @param fen - Position FEN à valider
 * @returns true si valide, false sinon
 */
function validateFen(fen: string): boolean {
  try {
    ChessService.loadPosition(fen);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Valide une séquence de coups solution
 * @param fen - Position FEN initiale
 * @param moves - Séquence de coups en notation SAN
 * @returns Résultat de validation avec détails
 */
function validateSolutionMoves(fen: string, moves: string[]): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
} {
  if (!moves || moves.length === 0) {
    return {
      isValid: false,
      error: "La séquence de coups solution est vide",
    };
  }

  try {
    const game = ChessService.loadPosition(fen);
    const warnings: string[] = [];

    // Valider chaque coup de la séquence
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const validationResult = ChessService.validateMove(game, move);

      if (!validationResult.isValid) {
        return {
          isValid: false,
          error: `Coup invalide à l'étape ${i + 1}/${moves.length}: ${move}. ${validationResult.error || ""}`,
        };
      }

      // Jouer le coup pour continuer la validation
      ChessService.makeMove(game, move);
    }

    // Vérifier que la séquence mène à un avantage tactique
    // On vérifie simplement si la partie est terminée (mat) ou si c'est une position avec avantage clair
    const finalState = ChessService.getGameState(game);
    if (finalState.isCheckmate) {
      // Mat = avantage tactique clair, c'est bon
    } else if (finalState.isDraw || finalState.isStalemate) {
      warnings.push("La séquence se termine par un match nul, ce qui peut indiquer un avantage tactique limité");
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Erreur lors de la validation des coups",
    };
  }
}

/**
 * Détecte si une position est un doublon basé sur le FEN
 * @param puzzles - Liste de puzzles à vérifier
 * @returns Rapport de doublons
 */
export interface DuplicateReport {
  /** Groupes de doublons (FEN -> liste d'indices) */
  duplicates: Map<string, number[]>;
  /** Nombre total de doublons détectés */
  count: number;
}

export function findDuplicates(puzzles: ParsedTacticalProblem[]): DuplicateReport {
  const fenMap = new Map<string, number[]>();
  
  puzzles.forEach((puzzle, index) => {
    const fen = puzzle.position_fen;
    if (!fenMap.has(fen)) {
      fenMap.set(fen, []);
    }
    fenMap.get(fen)!.push(index);
  });

  // Filtrer pour ne garder que les FEN avec plusieurs occurrences
  const duplicates = new Map<string, number[]>();
  fenMap.forEach((indices, fen) => {
    if (indices.length > 1) {
      duplicates.set(fen, indices);
    }
  });

  return {
    duplicates,
    count: duplicates.size,
  };
}

/**
 * Valide un puzzle Lichess individuel
 * @param puzzle - Puzzle à valider
 * @returns Résultat de validation
 */
export function validateLichessPuzzle(
  puzzle: ParsedTacticalProblem
): ValidationResult {
  const warnings: string[] = [];

  // 1. Validation FEN
  if (!validateFen(puzzle.position_fen)) {
    return {
      isValid: false,
      error: `Position FEN invalide: ${puzzle.position_fen}`,
    };
  }

  // 2. Validation des coups solution
  const movesValidation = validateSolutionMoves(
    puzzle.position_fen,
    puzzle.solution_moves
  );

  if (!movesValidation.isValid) {
    return {
      isValid: false,
      error: movesValidation.error,
    };
  }

  if (movesValidation.warnings) {
    warnings.push(...movesValidation.warnings);
  }

  // 3. Vérifier que le type de tactique est valide
  const validTacticTypes: TacticType[] = [
    "Fourchette",
    "Clouage",
    "Enfilade",
    "Découverte",
    "Mat",
    "Gain de matériel",
    "Double attaque",
    "Sacrifice",
  ];

  if (!validTacticTypes.includes(puzzle.tactic_type)) {
    warnings.push(`Type de tactique inconnu: ${puzzle.tactic_type}, sera mappé vers "Gain de matériel"`);
  }

  // 4. Vérifier que la difficulté est valide
  const validDifficulties: TacticalDifficulty[] = ["Facile", "Moyen", "Difficile"];
  if (!validDifficulties.includes(puzzle.difficulty)) {
    return {
      isValid: false,
      error: `Difficulté invalide: ${puzzle.difficulty}`,
    };
  }

  // 5. Vérifier que l'explication n'est pas vide
  if (!puzzle.explanation || puzzle.explanation.trim().length === 0) {
    warnings.push("L'explication est vide, une explication générique sera utilisée");
  }

  // Convertir ParsedTacticalProblem en TacticalProblem pour retour
  // Note: id et created_at seront générés par la base de données
  const tacticalProblem: TacticalProblem = {
    id: "", // Sera généré par Supabase
    position_fen: puzzle.position_fen,
    solution_moves: puzzle.solution_moves,
    difficulty: puzzle.difficulty,
    tactic_type: puzzle.tactic_type,
    explanation: puzzle.explanation,
    source: "imported",
    created_at: new Date().toISOString(), // Sera remplacé par Supabase
  };

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    problem: tacticalProblem,
  };
}

/**
 * Valide un lot de puzzles Lichess
 * @param puzzles - Array de puzzles à valider
 * @returns Rapport de validation
 */
export function validatePuzzlesBatch(
  puzzles: ParsedTacticalProblem[]
): ValidationReport {
  const report: ValidationReport = {
    total: puzzles.length,
    valid: 0,
    invalid: 0,
    withWarnings: 0,
    errors: [],
    warnings: [],
  };

  puzzles.forEach((puzzle) => {
    const result = validateLichessPuzzle(puzzle);

    if (result.isValid) {
      report.valid++;
      if (result.warnings && result.warnings.length > 0) {
        report.withWarnings++;
        result.warnings.forEach((warning) => {
          report.warnings.push({ puzzle, warning });
        });
      }
    } else {
      report.invalid++;
      if (result.error) {
        report.errors.push({ puzzle, error: result.error });
      }
    }
  });

  return report;
}

