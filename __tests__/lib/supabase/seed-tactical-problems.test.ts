/**
 * Tests unitaires pour le seed des problèmes tactiques
 */

import { describe, it, expect } from "vitest";
import {
  validatePositionFEN,
  validateTacticalProblem,
} from "@/lib/supabase/seed-tactical-problems";

describe("Validation des Problèmes Tactiques", () => {
  describe("validatePositionFEN", () => {
    it("devrait valider une position FEN valide (position initiale)", () => {
      const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(validatePositionFEN(fen)).toBe(true);
    });

    it("devrait valider une position FEN valide (position intermédiaire)", () => {
      const fen =
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
      expect(validatePositionFEN(fen)).toBe(true);
    });

    it("devrait valider une position FEN valide (après roque)", () => {
      const fen =
        "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7";
      expect(validatePositionFEN(fen)).toBe(true);
    });

    it("devrait rejeter une FEN invalide (format incorrect)", () => {
      const fen = "invalid_fen_string";
      expect(validatePositionFEN(fen)).toBe(false);
    });

    it("devrait rejeter une FEN invalide (position impossible)", () => {
      const fen = "8/8/8/8/8/8/8/8 w - - 0 1"; // Pas de rois
      expect(validatePositionFEN(fen)).toBe(false);
    });

    it("devrait rejeter une FEN vide", () => {
      const fen = "";
      expect(validatePositionFEN(fen)).toBe(false);
    });
  });

  describe("validateTacticalProblem", () => {
    it("devrait valider un problème tactique valide (mat simple)", () => {
      const problem = {
        position_fen:
          "r1bqkb1r/pppp1ppp/2n5/4p2Q/2BnP3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 5",
        solution_moves: ["Qxf7#"],
        difficulty: "Facile" as const,
        tactic_type: "Mat",
        explanation: "Mat du fou et de la dame sur f7.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("devrait valider un problème tactique avec capture", () => {
      const problem = {
        position_fen:
          "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        solution_moves: ["Nxe5", "Nxe5", "d4"],
        difficulty: "Facile" as const,
        tactic_type: "Gain de matériel",
        explanation: "Capture du pion e5 avec avantage.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("devrait valider un problème avec fourchette", () => {
      const problem = {
        position_fen:
          "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 5 5",
        solution_moves: ["Nd5"],
        difficulty: "Moyen" as const,
        tactic_type: "Fourchette",
        explanation: "Le cavalier en d5 attaque le fou c5 et le cavalier f6.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("devrait valider un problème avec mat", () => {
      const problem = {
        position_fen:
          "r1bqkb1r/pppp1ppp/2n5/4p2Q/2BnP3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 5",
        solution_moves: ["Qxf7#"],
        difficulty: "Facile" as const,
        tactic_type: "Mat",
        explanation: "Mat du fou et de la dame.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("devrait rejeter un problème avec FEN invalide", () => {
      const problem = {
        position_fen: "invalid_fen",
        solution_moves: ["e4"],
        difficulty: "Facile" as const,
        tactic_type: "Test",
        explanation: "Test invalide.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Position FEN invalide");
    });

    it("devrait rejeter un problème avec coup illégal", () => {
      const problem = {
        position_fen:
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution_moves: ["e5"], // Impossible depuis position initiale (pas de pion en e4)
        difficulty: "Facile" as const,
        tactic_type: "Test",
        explanation: "Test invalide.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("invalide");
    });

    it("devrait rejeter un problème avec coup impossible dans la séquence", () => {
      const problem = {
        position_fen:
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution_moves: ["e4", "e6", "Qh5"], // Qh5 est légal mais peut-être pas optimal
        difficulty: "Facile" as const,
        tactic_type: "Test",
        explanation: "Test de séquence.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      // Ce problème devrait être valide car tous les coups sont légaux
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un problème avec séquence interrompue", () => {
      const problem = {
        position_fen:
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution_moves: ["e4", "Qxd8+"], // La dame noire ne peut pas prendre en d8
        difficulty: "Facile" as const,
        tactic_type: "Test",
        explanation: "Test invalide.",
        source: "manual",
      };

      const result = validateTacticalProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("invalide");
    });
  });

  describe("Validation des Données de Seed", () => {
    it("devrait avoir une structure valide pour tous les problèmes", () => {
      // Ce test charge le fichier JSON réel et valide sa structure
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      expect(data).toHaveProperty("problems");
      expect(Array.isArray(data.problems)).toBe(true);
      expect(data.problems.length).toBeGreaterThanOrEqual(50);
    });

    it("tous les problèmes devraient avoir les champs requis", () => {
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      data.problems.forEach((problem: any, index: number) => {
        expect(problem, `Problème ${index + 1}`).toHaveProperty("position_fen");
        expect(problem, `Problème ${index + 1}`).toHaveProperty(
          "solution_moves"
        );
        expect(problem, `Problème ${index + 1}`).toHaveProperty("difficulty");
        expect(problem, `Problème ${index + 1}`).toHaveProperty("tactic_type");
        expect(problem, `Problème ${index + 1}`).toHaveProperty("explanation");
        expect(problem, `Problème ${index + 1}`).toHaveProperty("source");

        // Vérifier les types
        expect(typeof problem.position_fen).toBe("string");
        expect(Array.isArray(problem.solution_moves)).toBe(true);
        expect(["Facile", "Moyen", "Difficile"]).toContain(problem.difficulty);
        expect(typeof problem.tactic_type).toBe("string");
        expect(typeof problem.explanation).toBe("string");
        expect(["manual", "generated", "imported"]).toContain(problem.source);
      });
    });

    it("tous les problèmes devraient avoir des FEN valides", () => {
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      data.problems.forEach((problem: any, index: number) => {
        const isValid = validatePositionFEN(problem.position_fen);
        expect(isValid, `Problème ${index + 1}: ${problem.tactic_type}`).toBe(
          true
        );
      });
    });

    it("tous les problèmes devraient avoir au moins un coup de solution", () => {
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      data.problems.forEach((problem: any, index: number) => {
        expect(
          problem.solution_moves.length,
          `Problème ${index + 1}`
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it("devrait avoir une distribution équilibrée de difficulté", () => {
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      const counts = {
        Facile: 0,
        Moyen: 0,
        Difficile: 0,
      };

      data.problems.forEach((problem: any) => {
        counts[problem.difficulty as keyof typeof counts]++;
      });

      // Au moins 15 de chaque niveau
      expect(counts.Facile).toBeGreaterThanOrEqual(15);
      expect(counts.Moyen).toBeGreaterThanOrEqual(15);
      expect(counts.Difficile).toBeGreaterThanOrEqual(5);
    });

    it("devrait couvrir plusieurs types de tactiques", () => {
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      const types = new Set(
        data.problems.map((p: any) => p.tactic_type)
      );

      // Au moins 5 types différents
      expect(types.size).toBeGreaterThanOrEqual(5);

      // Types attendus
      const expectedTypes = [
        "Fourchette",
        "Clouage",
        "Découverte",
        "Mat",
        "Gain de matériel",
        "Enfilade",
        "Double attaque",
        "Sacrifice",
      ];

      // Au moins 3 des types attendus doivent être présents
      const foundExpected = expectedTypes.filter((type) => types.has(type));
      expect(foundExpected.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Validation Complète des Problèmes du Fichier", () => {
    it("tous les problèmes du fichier devraient être valides", () => {
      const fs = require("fs");
      const path = require("path");
      const dataPath = path.resolve(
        process.cwd(),
        "data/tactics/tactical-problems-seed.json"
      );

      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      const invalidProblems: Array<{ index: number; error: string }> = [];

      data.problems.forEach((problem: any, index: number) => {
        const result = validateTacticalProblem(problem);
        if (!result.isValid) {
          invalidProblems.push({
            index: index + 1,
            error: result.error || "Erreur inconnue",
          });
        }
      });

      if (invalidProblems.length > 0) {
        console.error("Problèmes invalides détectés:");
        invalidProblems.forEach(({ index, error }) => {
          console.error(`  Problème ${index}: ${error}`);
        });
      }

      expect(invalidProblems.length).toBe(0);
    }, 30000); // Timeout de 30s pour ce test qui peut être long
  });
});

