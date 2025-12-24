/**
 * Tests unitaires pour le service d'import CSV Lichess
 */

import { describe, it, expect } from "vitest";
import {
  parseLichessCsv,
  type LichessCsvRow,
  type ParseResult,
} from "@/lib/tactics/lichessCsvImportService";

describe("lichessCsvImportService", () => {
  /**
   * CSV valide avec toutes les colonnes
   */
  const validCsv = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,themes,GameUrl,OpeningTags
puzzle1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5,1500,50,100,1000,fork,https://lichess.org/game1,C20
puzzle2,rnbqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4,b4f8 e8f8 d5f8,1800,75,200,2000,pin sacrifice,https://lichess.org/game2,C70`;

  /**
   * CSV avec colonnes minimales
   */
  const minimalCsv = `PuzzleId,FEN,Moves,Rating,themes
puzzle3,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1200,fork`;

  /**
   * CSV avec erreurs (colonnes manquantes)
   */
  const invalidCsvMissingColumns = `PuzzleId,FEN,Moves
puzzle4,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4`;

  /**
   * CSV avec rating invalide
   */
  const invalidCsvBadRating = `PuzzleId,FEN,Moves,Rating,themes
puzzle5,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,invalid,fork`;

  /**
   * CSV avec coups UCI invalides
   */
  const invalidCsvBadMoves = `PuzzleId,FEN,Moves,Rating,themes
puzzle6,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,invalidmove,1500,fork`;

  /**
   * CSV avec FEN invalide
   */
  const invalidCsvBadFen = `PuzzleId,FEN,Moves,Rating,themes
puzzle7,invalidfen,e2e4,1500,fork`;

  describe("parseLichessCsv", () => {
    it("devrait parser un CSV valide avec toutes les colonnes", () => {
      const result: ParseResult = parseLichessCsv(validCsv);

      expect(result.report.total).toBe(2);
      expect(result.report.success).toBe(2);
      expect(result.report.errors).toBe(0);
      expect(result.problems).toHaveLength(2);

      // Vérifier le premier puzzle
      const puzzle1 = result.problems[0];
      expect(puzzle1.position_fen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
      expect(puzzle1.solution_moves).toEqual(["e4", "e5"]);
      expect(puzzle1.difficulty).toBe("Moyen"); // rating 1500 >= 1400 et < 1800
      expect(puzzle1.tactic_type).toBe("Fourchette");
      expect(puzzle1.explanation).toContain("fourchette");
      expect(puzzle1.metadata?.lichess_rating).toBe(1500);
      expect(puzzle1.metadata?.lichess_puzzle_id).toBe("puzzle1");
    });

    it("devrait parser un CSV avec colonnes minimales", () => {
      const result: ParseResult = parseLichessCsv(minimalCsv);

      expect(result.report.total).toBe(1);
      expect(result.report.success).toBe(1);
      expect(result.report.errors).toBe(0);
      expect(result.problems).toHaveLength(1);

      const puzzle = result.problems[0];
      expect(puzzle.position_fen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
      expect(puzzle.solution_moves).toEqual(["e4"]);
      expect(puzzle.difficulty).toBe("Facile"); // rating 1200 < 1400
    });

    it("devrait détecter les colonnes manquantes", () => {
      const result: ParseResult = parseLichessCsv(invalidCsvMissingColumns);

      expect(result.report.total).toBe(1);
      expect(result.report.success).toBe(0);
      expect(result.report.errors).toBeGreaterThan(0);
      expect(result.problems).toHaveLength(0);
      expect(result.report.errorDetails[0].message).toContain(
        "Colonnes essentielles manquantes"
      );
    });

    it("devrait détecter un rating invalide", () => {
      const result: ParseResult = parseLichessCsv(invalidCsvBadRating);

      expect(result.report.total).toBe(1);
      expect(result.report.success).toBe(0);
      expect(result.report.errors).toBeGreaterThan(0);
      expect(result.report.errorDetails[0].message).toContain("Rating invalide");
    });

    it("devrait détecter des coups UCI invalides", () => {
      const result: ParseResult = parseLichessCsv(invalidCsvBadMoves);

      expect(result.report.total).toBe(1);
      expect(result.report.success).toBe(0);
      expect(result.report.errors).toBeGreaterThan(0);
      expect(result.report.errorDetails[0].message).toContain("coup");
    });

    it("devrait convertir correctement les ratings en difficulté", () => {
      const csvFacile = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1300,fork`;
      const csvMoyen = `PuzzleId,FEN,Moves,Rating,themes
p2,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,fork`;
      const csvDifficile = `PuzzleId,FEN,Moves,Rating,themes
p3,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,2000,fork`;

      const resultFacile = parseLichessCsv(csvFacile);
      const resultMoyen = parseLichessCsv(csvMoyen);
      const resultDifficile = parseLichessCsv(csvDifficile);

      expect(resultFacile.problems[0].difficulty).toBe("Facile");
      expect(resultMoyen.problems[0].difficulty).toBe("Moyen");
      expect(resultDifficile.problems[0].difficulty).toBe("Difficile");
    });

    it("devrait mapper correctement les themes vers les types de tactiques", () => {
      const csvThemes = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,fork
p2,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,pin
p3,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,skewer
p4,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,discoveredAttack
p5,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,mateIn2
p6,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,sacrifice
p7,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,unknownTheme`;

      const result = parseLichessCsv(csvThemes);

      expect(result.problems).toHaveLength(7);
      expect(result.problems[0].tactic_type).toBe("Fourchette");
      expect(result.problems[1].tactic_type).toBe("Clouage");
      expect(result.problems[2].tactic_type).toBe("Enfilade");
      expect(result.problems[3].tactic_type).toBe("Découverte");
      expect(result.problems[4].tactic_type).toBe("Mat");
      expect(result.problems[5].tactic_type).toBe("Sacrifice");
      expect(result.problems[6].tactic_type).toBe("Gain de matériel"); // theme inconnu -> défaut
    });

    it("devrait gérer les themes multiples (prendre le premier connu)", () => {
      const csvMultipleThemes = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,fork,pin,sacrifice`;

      const result = parseLichessCsv(csvMultipleThemes);

      expect(result.problems[0].tactic_type).toBe("Fourchette"); // Premier theme connu
    });

    it("devrait convertir les coups UCI en notation SAN", () => {
      const csvUci = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5 g1f3,1500,fork`;

      const result = parseLichessCsv(csvUci);

      expect(result.problems[0].solution_moves).toEqual(["e4", "e5", "Nf3"]);
    });

    it("devrait générer des explications basiques pour chaque type", () => {
      const csv = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,fork
p2,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5,1500,mateIn2`;

      const result = parseLichessCsv(csv);

      expect(result.problems[0].explanation).toContain("fourchette");
      expect(result.problems[1].explanation).toContain("mat");
      expect(result.problems[1].explanation).toContain("2 coups");
    });

    it("devrait inclure les métadonnées optionnelles quand disponibles", () => {
      const csvWithMetadata = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,themes,GameUrl,OpeningTags
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,50,100,1000,fork,https://lichess.org/game1,C20`;

      const result = parseLichessCsv(csvWithMetadata);

      expect(result.problems[0].metadata?.popularity).toBe(100);
      expect(result.problems[0].metadata?.nb_plays).toBe(1000);
      expect(result.problems[0].metadata?.game_url).toBe("https://lichess.org/game1");
      expect(result.problems[0].metadata?.opening_tags).toBe("C20");
    });

    it("devrait gérer un CSV vide", () => {
      const emptyCsv = `PuzzleId,FEN,Moves,Rating,themes`;

      const result: ParseResult = parseLichessCsv(emptyCsv);

      expect(result.report.total).toBe(0);
      expect(result.report.success).toBe(0);
      expect(result.report.errors).toBe(0);
      expect(result.problems).toHaveLength(0);
    });

    it("devrait gérer un CSV avec des lignes vides", () => {
      const csvWithEmptyLines = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,fork

p2,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,pin`;

      const result: ParseResult = parseLichessCsv(csvWithEmptyLines);

      expect(result.report.total).toBe(2);
      expect(result.report.success).toBe(2);
    });

    it("devrait créer un rapport détaillé avec tous les problèmes", () => {
      const csvMixed = `PuzzleId,FEN,Moves,Rating,themes
p1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,fork
p2,,e2e4,1500,fork
p3,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,invalid,fork
p4,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1600,pin`;

      const result: ParseResult = parseLichessCsv(csvMixed);

      expect(result.report.total).toBe(4);
      expect(result.report.success).toBeGreaterThan(0);
      expect(result.report.errors).toBeGreaterThan(0);
      expect(result.report.errorDetails.length).toBeGreaterThan(0);
      expect(result.report.errorDetails[0].line).toBeGreaterThan(1); // Pas le header
    });
  });
});

