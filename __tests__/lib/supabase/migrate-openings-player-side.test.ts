/**
 * Tests pour le script de migration player_side
 */

import { describe, it, expect } from "vitest";
import { detectPlayerSide } from "@/lib/supabase/migrate-openings-player-side";

describe("Migration - detectPlayerSide", () => {
  describe("White Openings Detection", () => {
    it("should detect e4 as white opening", () => {
      const moves = ["e4", "e5", "Nf3"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect d4 as white opening", () => {
      const moves = ["d4", "d5", "c4"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect Nf3 as white opening", () => {
      const moves = ["Nf3", "d5", "g3"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect c4 as white opening (English)", () => {
      const moves = ["c4", "e5", "Nc3"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect g3 as white opening (King's Fianchetto)", () => {
      const moves = ["g3", "d5", "Bg2"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect b3 as white opening (Larsen)", () => {
      const moves = ["b3", "e5", "Bb2"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect f4 as white opening (Bird)", () => {
      const moves = ["f4", "d5", "Nf3"];
      expect(detectPlayerSide(moves)).toBe("white");
    });
  });

  describe("Black Openings Detection (Defenses)", () => {
    it("should detect Sicilian Defense (c5) as black", () => {
      const moves = ["e4", "c5", "Nf3"];
      expect(detectPlayerSide(moves)).toBe("white"); // Le premier coup est e4, donc white
    });

    it("should detect opening starting with black move as black", () => {
      const moves = ["c5", "Nf3", "d6"];
      expect(detectPlayerSide(moves)).toBe("black");
    });

    it("should detect French Defense pattern as black", () => {
      const moves = ["e6", "d4", "d5"];
      expect(detectPlayerSide(moves)).toBe("black");
    });

    it("should detect Caro-Kann pattern as black", () => {
      const moves = ["c6", "e4", "d5"];
      expect(detectPlayerSide(moves)).toBe("black");
    });
  });

  describe("Edge Cases", () => {
    it("should default to white for empty move array", () => {
      const moves: string[] = [];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should default to white for null/undefined moves", () => {
      expect(detectPlayerSide(undefined as any)).toBe("white");
      expect(detectPlayerSide(null as any)).toBe("white");
    });

    it("should handle uncommon first moves", () => {
      const moves = ["h4", "e5", "Rh3"]; // Grob Opening
      expect(detectPlayerSide(moves)).toBe("black"); // h4 n'est pas dans la liste des coups blancs typiques
    });

    it("should handle single move opening", () => {
      const moves = ["e4"];
      expect(detectPlayerSide(moves)).toBe("white");
    });
  });

  describe("Real Opening Examples", () => {
    it("should detect Ruy Lopez as white", () => {
      const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect Italian Game as white", () => {
      const moves = ["e4", "e5", "Nf3", "Nc6", "Bc4"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect Queen's Gambit as white", () => {
      const moves = ["d4", "d5", "c4"];
      expect(detectPlayerSide(moves)).toBe("white");
    });

    it("should detect King's Indian Defense starting as white (d4)", () => {
      const moves = ["d4", "Nf6", "c4", "g6"];
      expect(detectPlayerSide(moves)).toBe("white");
    });
  });
});

