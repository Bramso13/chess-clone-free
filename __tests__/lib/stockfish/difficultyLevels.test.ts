import { describe, it, expect } from "vitest";
import {
  DIFFICULTY_LEVELS,
  getDifficultyLevel,
  getDefaultDifficulty,
  isValidDifficultyId,
  getAllDifficultyIds,
  getNextDifficulty,
  getPreviousDifficulty,
  type DifficultyLevel,
} from "@/lib/stockfish/difficultyLevels";

describe("Difficulty Levels Configuration", () => {
  describe("DIFFICULTY_LEVELS Array", () => {
    it("contient au moins 5 niveaux de difficulté", () => {
      expect(DIFFICULTY_LEVELS.length).toBeGreaterThanOrEqual(5);
    });

    it("contient exactement 6 niveaux (incluant casual)", () => {
      expect(DIFFICULTY_LEVELS.length).toBe(6);
    });

    it("tous les niveaux ont une structure valide", () => {
      DIFFICULTY_LEVELS.forEach((level) => {
        // Vérifier que tous les champs requis sont présents
        expect(level.id).toBeTruthy();
        expect(typeof level.id).toBe("string");

        expect(level.name).toBeTruthy();
        expect(typeof level.name).toBe("string");

        expect(level.description).toBeTruthy();
        expect(typeof level.description).toBe("string");

        expect(level.estimatedElo).toBeGreaterThan(0);
        expect(typeof level.estimatedElo).toBe("number");

        expect(level.recommendedFor).toBeTruthy();
        expect(typeof level.recommendedFor).toBe("string");

        // Vérifier la configuration Stockfish
        expect(level.stockfishConfig).toBeDefined();
        expect(level.stockfishConfig.skillLevel).toBeDefined();
        expect(level.stockfishConfig.depth).toBeDefined();
        expect(level.stockfishConfig.moveTime).toBeDefined();
      });
    });

    it("tous les IDs sont uniques", () => {
      const ids = DIFFICULTY_LEVELS.map((level) => level.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("tous les noms sont uniques", () => {
      const names = DIFFICULTY_LEVELS.map((level) => level.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe("Validation des Configurations Stockfish", () => {
    it("tous les skillLevel sont entre 0 et 20", () => {
      DIFFICULTY_LEVELS.forEach((level) => {
        expect(level.stockfishConfig.skillLevel).toBeGreaterThanOrEqual(0);
        expect(level.stockfishConfig.skillLevel).toBeLessThanOrEqual(20);
      });
    });

    it("tous les depth sont des valeurs positives raisonnables", () => {
      DIFFICULTY_LEVELS.forEach((level) => {
        expect(level.stockfishConfig.depth).toBeGreaterThan(0);
        expect(level.stockfishConfig.depth).toBeLessThanOrEqual(30);
      });
    });

    it("tous les moveTime sont des valeurs positives", () => {
      DIFFICULTY_LEVELS.forEach((level) => {
        if (level.stockfishConfig.moveTime) {
          expect(level.stockfishConfig.moveTime).toBeGreaterThan(0);
          expect(level.stockfishConfig.moveTime).toBeLessThanOrEqual(10000);
        }
      });
    });
  });

  describe("Ordre et Progression des Niveaux", () => {
    it("les niveaux sont ordonnés par Elo croissant", () => {
      for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
        expect(DIFFICULTY_LEVELS[i].estimatedElo).toBeGreaterThan(
          DIFFICULTY_LEVELS[i - 1].estimatedElo
        );
      }
    });

    it("les skillLevel sont en ordre croissant", () => {
      for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
        expect(DIFFICULTY_LEVELS[i].stockfishConfig.skillLevel).toBeGreaterThanOrEqual(
          DIFFICULTY_LEVELS[i - 1].stockfishConfig.skillLevel
        );
      }
    });

    it("les depth sont en ordre croissant", () => {
      for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
        expect(DIFFICULTY_LEVELS[i].stockfishConfig.depth).toBeGreaterThanOrEqual(
          DIFFICULTY_LEVELS[i - 1].stockfishConfig.depth
        );
      }
    });

    it("les estimations Elo sont dans des plages raisonnables", () => {
      expect(DIFFICULTY_LEVELS[0].estimatedElo).toBeLessThanOrEqual(1000); // Débutant
      expect(DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1].estimatedElo).toBeGreaterThanOrEqual(2500); // Maître
    });
  });

  describe("Niveaux Spécifiques Requis", () => {
    it("contient un niveau beginner", () => {
      const beginner = DIFFICULTY_LEVELS.find((l) => l.id === "beginner");
      expect(beginner).toBeDefined();
      expect(beginner?.estimatedElo).toBeLessThanOrEqual(1000);
    });

    it("contient un niveau casual", () => {
      const casual = DIFFICULTY_LEVELS.find((l) => l.id === "casual");
      expect(casual).toBeDefined();
      expect(casual?.estimatedElo).toBeGreaterThan(1000);
      expect(casual?.estimatedElo).toBeLessThan(1300);
    });

    it("contient un niveau intermediate", () => {
      const intermediate = DIFFICULTY_LEVELS.find((l) => l.id === "intermediate");
      expect(intermediate).toBeDefined();
      expect(intermediate?.estimatedElo).toBeGreaterThanOrEqual(1200);
      expect(intermediate?.estimatedElo).toBeLessThanOrEqual(1600);
    });

    it("contient un niveau advanced", () => {
      const advanced = DIFFICULTY_LEVELS.find((l) => l.id === "advanced");
      expect(advanced).toBeDefined();
      expect(advanced?.estimatedElo).toBeGreaterThanOrEqual(1600);
      expect(advanced?.estimatedElo).toBeLessThanOrEqual(2000);
    });

    it("contient un niveau expert", () => {
      const expert = DIFFICULTY_LEVELS.find((l) => l.id === "expert");
      expect(expert).toBeDefined();
      expect(expert?.estimatedElo).toBeGreaterThanOrEqual(2000);
      expect(expert?.estimatedElo).toBeLessThanOrEqual(2400);
    });

    it("contient un niveau master", () => {
      const master = DIFFICULTY_LEVELS.find((l) => l.id === "master");
      expect(master).toBeDefined();
      expect(master?.estimatedElo).toBeGreaterThan(2400);
    });
  });

  describe("getDifficultyLevel()", () => {
    it("retourne le niveau correct pour un ID valide", () => {
      const level = getDifficultyLevel("intermediate");
      expect(level).toBeDefined();
      expect(level?.id).toBe("intermediate");
    });

    it("retourne undefined pour un ID invalide", () => {
      const level = getDifficultyLevel("invalid");
      expect(level).toBeUndefined();
    });

    it("retourne le bon niveau pour chaque ID", () => {
      const ids = ["beginner", "casual", "intermediate", "advanced", "expert", "master"];
      ids.forEach((id) => {
        const level = getDifficultyLevel(id);
        expect(level).toBeDefined();
        expect(level?.id).toBe(id);
      });
    });

    it("est case-sensitive", () => {
      const level = getDifficultyLevel("INTERMEDIATE");
      expect(level).toBeUndefined();
    });
  });

  describe("getDefaultDifficulty()", () => {
    it("retourne le niveau intermediate par défaut", () => {
      const defaultLevel = getDefaultDifficulty();
      expect(defaultLevel.id).toBe("intermediate");
    });

    it("retourne un objet DifficultyLevel valide", () => {
      const defaultLevel = getDefaultDifficulty();
      expect(defaultLevel.id).toBeTruthy();
      expect(defaultLevel.name).toBeTruthy();
      expect(defaultLevel.description).toBeTruthy();
      expect(defaultLevel.estimatedElo).toBeGreaterThan(0);
      expect(defaultLevel.stockfishConfig).toBeDefined();
    });

    it("retourne le 3ème niveau (index 2)", () => {
      const defaultLevel = getDefaultDifficulty();
      expect(defaultLevel).toBe(DIFFICULTY_LEVELS[2]);
    });
  });

  describe("isValidDifficultyId()", () => {
    it("retourne true pour un ID valide", () => {
      expect(isValidDifficultyId("beginner")).toBe(true);
      expect(isValidDifficultyId("intermediate")).toBe(true);
      expect(isValidDifficultyId("master")).toBe(true);
    });

    it("retourne false pour un ID invalide", () => {
      expect(isValidDifficultyId("invalid")).toBe(false);
      expect(isValidDifficultyId("")).toBe(false);
      expect(isValidDifficultyId("BEGINNER")).toBe(false);
    });

    it("valide tous les IDs existants", () => {
      DIFFICULTY_LEVELS.forEach((level) => {
        expect(isValidDifficultyId(level.id)).toBe(true);
      });
    });
  });

  describe("getAllDifficultyIds()", () => {
    it("retourne un array de tous les IDs", () => {
      const ids = getAllDifficultyIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(DIFFICULTY_LEVELS.length);
    });

    it("retourne les IDs dans le bon ordre", () => {
      const ids = getAllDifficultyIds();
      expect(ids).toEqual([
        "beginner",
        "casual",
        "intermediate",
        "advanced",
        "expert",
        "master",
      ]);
    });
  });

  describe("getNextDifficulty()", () => {
    it("retourne le niveau suivant pour un ID valide", () => {
      const next = getNextDifficulty("beginner");
      expect(next).toBeDefined();
      expect(next?.id).toBe("casual");
    });

    it("retourne undefined pour le niveau maximum", () => {
      const next = getNextDifficulty("master");
      expect(next).toBeUndefined();
    });

    it("retourne undefined pour un ID invalide", () => {
      const next = getNextDifficulty("invalid");
      expect(next).toBeUndefined();
    });

    it("la progression complète fonctionne", () => {
      let current = getDifficultyLevel("beginner");
      const progression: string[] = [current!.id];

      while (current) {
        const next = getNextDifficulty(current.id);
        if (next) {
          progression.push(next.id);
          current = next;
        } else {
          break;
        }
      }

      expect(progression).toEqual([
        "beginner",
        "casual",
        "intermediate",
        "advanced",
        "expert",
        "master",
      ]);
    });
  });

  describe("getPreviousDifficulty()", () => {
    it("retourne le niveau précédent pour un ID valide", () => {
      const prev = getPreviousDifficulty("intermediate");
      expect(prev).toBeDefined();
      expect(prev?.id).toBe("casual");
    });

    it("retourne undefined pour le niveau minimum", () => {
      const prev = getPreviousDifficulty("beginner");
      expect(prev).toBeUndefined();
    });

    it("retourne undefined pour un ID invalide", () => {
      const prev = getPreviousDifficulty("invalid");
      expect(prev).toBeUndefined();
    });

    it("la régression complète fonctionne", () => {
      let current = getDifficultyLevel("master");
      const regression: string[] = [current!.id];

      while (current) {
        const prev = getPreviousDifficulty(current.id);
        if (prev) {
          regression.push(prev.id);
          current = prev;
        } else {
          break;
        }
      }

      expect(regression).toEqual([
        "master",
        "expert",
        "advanced",
        "intermediate",
        "casual",
        "beginner",
      ]);
    });
  });

  describe("Temps de Réponse Attendus", () => {
    it("les niveaux faciles ont des temps courts (< 500ms)", () => {
      const beginner = getDifficultyLevel("beginner");
      const casual = getDifficultyLevel("casual");

      expect(beginner?.stockfishConfig.moveTime).toBeLessThanOrEqual(500);
      expect(casual?.stockfishConfig.moveTime).toBeLessThanOrEqual(500);
    });

    it("le niveau intermédiaire a un temps modéré (< 1000ms)", () => {
      const intermediate = getDifficultyLevel("intermediate");
      expect(intermediate?.stockfishConfig.moveTime).toBeLessThanOrEqual(1000);
    });

    it("les niveaux avancés ont des temps plus longs (>= 1000ms)", () => {
      const advanced = getDifficultyLevel("advanced");
      const expert = getDifficultyLevel("expert");
      const master = getDifficultyLevel("master");

      expect(advanced?.stockfishConfig.moveTime).toBeGreaterThanOrEqual(1000);
      expect(expert?.stockfishConfig.moveTime).toBeGreaterThanOrEqual(1000);
      expect(master?.stockfishConfig.moveTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("Cohérence Skill Level et Elo", () => {
    it("les Elo et skillLevel sont corrélés positivement", () => {
      for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
        const prev = DIFFICULTY_LEVELS[i - 1];
        const curr = DIFFICULTY_LEVELS[i];

        // Si Elo augmente, skillLevel devrait augmenter ou rester stable
        if (curr.estimatedElo > prev.estimatedElo) {
          expect(curr.stockfishConfig.skillLevel).toBeGreaterThanOrEqual(
            prev.stockfishConfig.skillLevel
          );
        }
      }
    });

    it("le niveau beginner a un Elo proche de 800", () => {
      const beginner = getDifficultyLevel("beginner");
      expect(beginner?.estimatedElo).toBeGreaterThanOrEqual(700);
      expect(beginner?.estimatedElo).toBeLessThanOrEqual(1000);
    });

    it("le niveau master a un Elo d'au moins 2500", () => {
      const master = getDifficultyLevel("master");
      expect(master?.estimatedElo).toBeGreaterThanOrEqual(2500);
    });
  });
});

