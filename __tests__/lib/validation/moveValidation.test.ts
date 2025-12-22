/**
 * Tests pour moveValidation
 */

import { describe, it, expect } from "vitest";
import {
  validateMoveAgainstOpening,
  findValidVariations,
  calculateProgress,
} from "@/lib/validation/moveValidation";
import type { OpeningVariation } from "@/types/chess";

describe("moveValidation", () => {
  const mockVariation: OpeningVariation = {
    name: "Main Line",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
  };

  describe("validateMoveAgainstOpening", () => {
    it("should validate correct move at beginning", () => {
      const result = validateMoveAgainstOpening("e4", mockVariation, 0);

      expect(result.valid).toBe(true);
      expect(result.message).toContain("Coup correct");
      expect(result.completed).toBe(false);
    });

    it("should validate correct move in middle", () => {
      const result = validateMoveAgainstOpening("Nf3", mockVariation, 2);

      expect(result.valid).toBe(true);
      expect(result.completed).toBe(false);
    });

    it("should validate last move and mark as completed", () => {
      const result = validateMoveAgainstOpening("Bb5", mockVariation, 4);

      expect(result.valid).toBe(true);
      expect(result.message).toContain("Félicitations");
      expect(result.completed).toBe(true);
    });

    it("should reject incorrect move", () => {
      const result = validateMoveAgainstOpening("d4", mockVariation, 0);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("incorrect");
      expect(result.message).toContain("e4");
      expect(result.expectedMove).toBe("e4");
      expect(result.completed).toBe(false);
    });

    it("should handle move beyond variation length", () => {
      const result = validateMoveAgainstOpening("a4", mockVariation, 5);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("complétée");
      expect(result.completed).toBe(true);
    });
  });

  describe("findValidVariations", () => {
    const variations: OpeningVariation[] = [
      { name: "Variation 1", moves: ["e4", "e5", "Nf3"] },
      { name: "Variation 2", moves: ["e4", "c5", "Nf3"] },
      { name: "Variation 3", moves: ["d4", "d5", "c4"] },
    ];

    it("should find variations matching first move", () => {
      const result = findValidVariations("e4", variations, 0);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Variation 1");
      expect(result[1].name).toBe("Variation 2");
    });

    it("should find single variation for specific move sequence", () => {
      const result = findValidVariations("e5", variations, 1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Variation 1");
    });

    it("should return empty array when no variations match", () => {
      const result = findValidVariations("a4", variations, 0);

      expect(result).toHaveLength(0);
    });

    it("should handle move index beyond variation length", () => {
      const result = findValidVariations("Nf3", variations, 5);

      expect(result).toHaveLength(0);
    });
  });

  describe("calculateProgress", () => {
    it("should calculate 0% for no moves", () => {
      expect(calculateProgress(0, 10)).toBe(0);
    });

    it("should calculate 50% for half moves", () => {
      expect(calculateProgress(5, 10)).toBe(50);
    });

    it("should calculate 100% for all moves", () => {
      expect(calculateProgress(10, 10)).toBe(100);
    });

    it("should handle zero total moves", () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it("should round to nearest integer", () => {
      expect(calculateProgress(1, 3)).toBe(33);
      expect(calculateProgress(2, 3)).toBe(67);
    });
  });
});

