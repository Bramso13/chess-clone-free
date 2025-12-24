/**
 * Tests unitaires pour le service de validation des données Lichess
 */

import { describe, it, expect } from "vitest";
import {
  validateLichessPuzzle,
  validatePuzzlesBatch,
  findDuplicates,
  type ValidationResult,
} from "@/lib/tactics/lichessDataValidator";
import type { ParsedTacticalProblem } from "@/lib/tactics/lichessCsvImportService";

describe("lichessDataValidator", () => {
  /**
   * Puzzle valide de base
   */
  const validPuzzle: ParsedTacticalProblem = {
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4"],
    difficulty: "Facile",
    tactic_type: "Fourchette",
    explanation: "Jouer e4 pour contrôler le centre",
    metadata: {
      lichess_rating: 1200,
      lichess_puzzle_id: "test-1",
    },
  };

  /**
   * Puzzle avec séquence de plusieurs coups
   */
  const multiMovePuzzle: ParsedTacticalProblem = {
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4", "e5", "Nf3"],
    difficulty: "Moyen",
    tactic_type: "Mat",
    explanation: "Séquence de mat en 3 coups",
  };

  describe("validateLichessPuzzle", () => {
    it("devrait valider un puzzle valide", () => {
      const result: ValidationResult = validateLichessPuzzle(validPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.problem).toBeDefined();
      expect(result.problem?.position_fen).toBe(validPuzzle.position_fen);
      expect(result.problem?.solution_moves).toEqual(validPuzzle.solution_moves);
      expect(result.problem?.difficulty).toBe(validPuzzle.difficulty);
      expect(result.problem?.tactic_type).toBe(validPuzzle.tactic_type);
      expect(result.problem?.source).toBe("imported");
    });

    it("devrait rejeter un puzzle avec FEN invalide", () => {
      const invalidPuzzle: ParsedTacticalProblem = {
        ...validPuzzle,
        position_fen: "invalid-fen",
      };

      const result: ValidationResult = validateLichessPuzzle(invalidPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("FEN invalide");
    });

    it("devrait rejeter un puzzle avec coups invalides", () => {
      const invalidPuzzle: ParsedTacticalProblem = {
        ...validPuzzle,
        solution_moves: ["invalid-move"],
      };

      const result: ValidationResult = validateLichessPuzzle(invalidPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Coup invalide");
    });

    it("devrait rejeter un puzzle avec séquence de coups vide", () => {
      const invalidPuzzle: ParsedTacticalProblem = {
        ...validPuzzle,
        solution_moves: [],
      };

      const result: ValidationResult = validateLichessPuzzle(invalidPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("vide");
    });

    it("devrait rejeter un puzzle avec difficulté invalide", () => {
      const invalidPuzzle: ParsedTacticalProblem = {
        ...validPuzzle,
        difficulty: "Très Difficile" as any,
      };

      const result: ValidationResult = validateLichessPuzzle(invalidPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Difficulté invalide");
    });

    it("devrait valider un puzzle avec plusieurs coups", () => {
      const result: ValidationResult = validateLichessPuzzle(multiMovePuzzle);

      expect(result.isValid).toBe(true);
      expect(result.problem?.solution_moves).toEqual(multiMovePuzzle.solution_moves);
    });

    it("devrait générer un avertissement pour explication vide", () => {
      const puzzleNoExplanation: ParsedTacticalProblem = {
        ...validPuzzle,
        explanation: "",
      };

      const result: ValidationResult = validateLichessPuzzle(puzzleNoExplanation);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes("explication"))).toBe(true);
    });
  });

  describe("validatePuzzlesBatch", () => {
    it("devrait valider un lot de puzzles valides", () => {
      const puzzles: ParsedTacticalProblem[] = [
        validPuzzle,
        multiMovePuzzle,
      ];

      const report = validatePuzzlesBatch(puzzles);

      expect(report.total).toBe(2);
      expect(report.valid).toBe(2);
      expect(report.invalid).toBe(0);
      expect(report.errors).toHaveLength(0);
    });

    it("devrait identifier les puzzles invalides dans un lot mixte", () => {
      const invalidPuzzle: ParsedTacticalProblem = {
        ...validPuzzle,
        position_fen: "invalid-fen",
      };

      const puzzles: ParsedTacticalProblem[] = [
        validPuzzle,
        invalidPuzzle,
        multiMovePuzzle,
      ];

      const report = validatePuzzlesBatch(puzzles);

      expect(report.total).toBe(3);
      expect(report.valid).toBe(2);
      expect(report.invalid).toBe(1);
      expect(report.errors).toHaveLength(1);
    });

    it("devrait compter les puzzles avec avertissements", () => {
      const puzzleWithWarning: ParsedTacticalProblem = {
        ...validPuzzle,
        explanation: "",
      };

      const puzzles: ParsedTacticalProblem[] = [
        validPuzzle,
        puzzleWithWarning,
      ];

      const report = validatePuzzlesBatch(puzzles);

      expect(report.total).toBe(2);
      expect(report.valid).toBe(2);
      expect(report.withWarnings).toBe(1);
      expect(report.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("findDuplicates", () => {
    it("devrait détecter les doublons basés sur le FEN", () => {
      const puzzle1: ParsedTacticalProblem = {
        ...validPuzzle,
        metadata: { lichess_puzzle_id: "p1" },
      };

      const puzzle2: ParsedTacticalProblem = {
        ...validPuzzle,
        metadata: { lichess_puzzle_id: "p2" },
      };

      const puzzle3: ParsedTacticalProblem = {
        ...multiMovePuzzle,
        metadata: { lichess_puzzle_id: "p3" },
      };

      const puzzles: ParsedTacticalProblem[] = [puzzle1, puzzle2, puzzle3];

      const duplicateReport = findDuplicates(puzzles);

      expect(duplicateReport.count).toBe(1);
      expect(duplicateReport.duplicates.has(puzzle1.position_fen)).toBe(true);
      const duplicateIndices = duplicateReport.duplicates.get(puzzle1.position_fen);
      expect(duplicateIndices).toEqual([0, 1]);
    });

    it("devrait retourner un rapport vide si aucun doublon", () => {
      const puzzles: ParsedTacticalProblem[] = [validPuzzle, multiMovePuzzle];

      const duplicateReport = findDuplicates(puzzles);

      expect(duplicateReport.count).toBe(0);
      expect(duplicateReport.duplicates.size).toBe(0);
    });
  });
});

