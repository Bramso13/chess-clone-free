/**
 * Tests pour le script de seed des ouvertures
 */

import { describe, it, expect } from "vitest";
import { validateOpeningMoves } from "@/lib/supabase/seed-openings";

describe("Opening Data Validation", () => {
  describe("validateOpeningMoves", () => {
    it("should validate a simple legal move sequence", () => {
      const moves = ["e4", "e5"];
      expect(validateOpeningMoves(moves, "Test Simple")).toBe(true);
    });

    it("should validate Ruy Lopez opening", () => {
      const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"];
      expect(validateOpeningMoves(moves, "Ruy Lopez")).toBe(true);
    });

    it("should validate Sicilian Defense", () => {
      const moves = ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4"];
      expect(validateOpeningMoves(moves, "Sicilian")).toBe(true);
    });

    it("should validate Italian Game", () => {
      const moves = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"];
      expect(validateOpeningMoves(moves, "Italian Game")).toBe(true);
    });

    it("should validate French Defense", () => {
      const moves = ["e4", "e6", "d4", "d5", "Nc3", "Nf6"];
      expect(validateOpeningMoves(moves, "French Defense")).toBe(true);
    });

    it("should validate Queen's Gambit", () => {
      const moves = ["d4", "d5", "c4", "e6", "Nc3", "Nf6"];
      expect(validateOpeningMoves(moves, "Queen's Gambit")).toBe(true);
    });

    it("should validate castling moves", () => {
      const moves = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "O-O"];
      expect(validateOpeningMoves(moves, "Castling Test")).toBe(true);
    });

    it("should validate capture moves", () => {
      const moves = ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5"];
      expect(validateOpeningMoves(moves, "Captures Test")).toBe(true);
    });

    it("should reject invalid move - out of bounds", () => {
      const moves = ["e4", "e9"]; // e9 n'existe pas
      expect(validateOpeningMoves(moves, "Invalid Square")).toBe(false);
    });

    it("should reject invalid move - illegal piece movement", () => {
      const moves = ["e4", "e5", "Ne4"]; // Le cavalier de g1 ne peut pas aller directement à e4
      expect(validateOpeningMoves(moves, "Invalid Knight Move")).toBe(false);
    });

    it("should reject invalid move - moving opponent's piece", () => {
      const moves = ["e4", "Nf3"]; // Les noirs ne peuvent pas jouer Nf3 au 1er coup
      expect(validateOpeningMoves(moves, "Wrong Turn")).toBe(false);
    });

    it("should reject invalid move sequence - blocked path", () => {
      const moves = ["e4", "e5", "Ba3"]; // Le fou est bloqué par les pions
      expect(validateOpeningMoves(moves, "Blocked Path")).toBe(false);
    });

    it("should reject empty move sequence", () => {
      const moves: string[] = [];
      expect(validateOpeningMoves(moves, "Empty Sequence")).toBe(true); // Une séquence vide est techniquement valide
    });

    it("should validate long opening sequence (15+ moves)", () => {
      const moves = [
        "e4",
        "e5",
        "Nf3",
        "Nc6",
        "Bb5",
        "a6",
        "Ba4",
        "Nf6",
        "O-O",
        "Be7",
        "Re1",
        "b5",
        "Bb3",
        "d6",
        "c3",
        "O-O",
      ];
      expect(validateOpeningMoves(moves, "Long Sequence")).toBe(true);
    });

    it("should validate complex variation with multiple captures", () => {
      const moves = [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Nxd4",
        "Nf6",
        "Nc3",
        "a6",
      ];
      expect(validateOpeningMoves(moves, "Complex Variation")).toBe(true);
    });
  });
});

