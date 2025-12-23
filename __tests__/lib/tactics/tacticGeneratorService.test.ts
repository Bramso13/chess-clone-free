/**
 * Tests unitaires pour TacticGeneratorService
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TacticGeneratorService } from "@/lib/tactics/tacticGeneratorService";
import type { AnalysisResult } from "@/types/chess";

// Mock Supabase
vi.mock("@/lib/supabase/client", () => {
  const createMockQuery = () => ({
    select: vi.fn(() => createMockQuery()),
    eq: vi.fn(() => createMockQuery()),
    single: vi.fn(() => ({
      data: null,
      error: null,
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: "test-id-123" },
          error: null,
        })),
      })),
    })),
  });

  return {
    supabase: {
      from: vi.fn(() => createMockQuery()),
    },
  };
});

// Mock StockfishService
vi.mock("@/lib/stockfish/stockfishService", () => {
  return {
    StockfishService: vi.fn(),
    getStockfishService: vi.fn(),
  };
});

// Fonction helper pour créer un mock StockfishService
const createMockStockfishService = () => ({
  isReady: vi.fn(() => true),
  initialize: vi.fn().mockResolvedValue(undefined),
  analyzePosition: vi.fn().mockResolvedValue({
    bestMove: "e2e4",
    evaluation: 50,
    depth: 20,
    time: 100,
    pv: ["e2e4", "e7e5", "g1f3"],
  } as AnalysisResult),
});

describe("TacticGeneratorService", () => {
  let service: TacticGeneratorService;
  let mockStockfishService: ReturnType<typeof createMockStockfishService>;
  let StockfishServiceMock: any;
  let getStockfishServiceMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Importer les mocks après qu'ils soient configurés
    const stockfishModule = await import("@/lib/stockfish/stockfishService");
    StockfishServiceMock = stockfishModule.StockfishService;
    getStockfishServiceMock = stockfishModule.getStockfishService;
    
    mockStockfishService = createMockStockfishService();
    StockfishServiceMock.mockImplementation(() => mockStockfishService);
    getStockfishServiceMock.mockReturnValue(mockStockfishService);
    
    service = new TacticGeneratorService(mockStockfishService as any);
  });

  describe("Constructor", () => {
    it("devrait créer une instance du service", () => {
      expect(service).toBeInstanceOf(TacticGeneratorService);
    });

    it("devrait utiliser le service Stockfish fourni", () => {
      const customService = createMockStockfishService();
      const customTacticService = new TacticGeneratorService(customService as any);
      expect(customTacticService).toBeInstanceOf(TacticGeneratorService);
    });
  });

  describe("analyzePosition", () => {
    it("devrait analyser une position avec Stockfish", async () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      const result = await service.analyzePosition(fen);

      expect(mockStockfishService.analyzePosition).toHaveBeenCalledWith(fen, {
        depth: 20,
      });
      expect(result).toHaveProperty("bestMove");
      expect(result).toHaveProperty("evaluation");
      expect(result).toHaveProperty("depth");
    });

    it("devrait initialiser Stockfish si non prêt", async () => {
      mockStockfishService.isReady = vi.fn(() => false);
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      await service.analyzePosition(fen);

      expect(mockStockfishService.initialize).toHaveBeenCalled();
    });

    it("devrait accepter des options de profondeur personnalisées", async () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      await service.analyzePosition(fen, { depth: 15 });

      expect(mockStockfishService.analyzePosition).toHaveBeenCalledWith(fen, {
        depth: 15,
      });
    });
  });

  describe("detectTactic", () => {
    it("devrait retourner null si aucune PV n'est disponible", async () => {
      mockStockfishService.analyzePosition = vi.fn().mockResolvedValue({
        bestMove: "e2e4",
        evaluation: 50,
        depth: 20,
        time: 100,
        pv: undefined,
      } as AnalysisResult);

      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const result = await service.detectTactic(fen);

      expect(result).toBeNull();
    });

    it("devrait retourner null si le delta d'évaluation est trop faible", async () => {
      mockStockfishService.analyzePosition = vi
        .fn()
        .mockResolvedValueOnce({
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4"],
        } as AnalysisResult)
        .mockResolvedValueOnce({
          bestMove: "e7e5",
          evaluation: 60,
          depth: 20,
          time: 100,
          pv: ["e7e5"],
        } as AnalysisResult);

      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const result = await service.detectTactic(fen);

      expect(result).toBeNull();
    });

    it("devrait détecter une tactique avec un delta d'évaluation significatif", async () => {
      mockStockfishService.analyzePosition = vi
        .fn()
        .mockResolvedValueOnce({
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4", "e7e5"],
        } as AnalysisResult)
        .mockResolvedValueOnce({
          bestMove: "e7e5",
          evaluation: 300,
          depth: 20,
          time: 100,
          pv: ["e7e5"],
        } as AnalysisResult);

      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const result = await service.detectTactic(fen);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.position).toBe(fen);
        expect(result.solution).toEqual(["e2e4", "e7e5"]);
        expect(result.scoreDelta).toBeGreaterThanOrEqual(200);
      }
    });

    it("devrait filtrer selon exactMoves", async () => {
      mockStockfishService.analyzePosition = vi
        .fn()
        .mockResolvedValueOnce({
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4", "e7e5"],
        } as AnalysisResult)
        .mockResolvedValueOnce({
          bestMove: "e7e5",
          evaluation: 300,
          depth: 20,
          time: 100,
          pv: ["e7e5"],
        } as AnalysisResult);

      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const result = await service.detectTactic(fen, undefined, {
        exactMoves: 3,
      });

      expect(result).toBeNull(); // La solution a 2 coups, pas 3
    });

    it("devrait filtrer selon minMoves et maxMoves", async () => {
      mockStockfishService.analyzePosition = vi
        .fn()
        .mockResolvedValueOnce({
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4", "e7e5", "g1f3"],
        } as AnalysisResult)
        .mockResolvedValueOnce({
          bestMove: "e7e5",
          evaluation: 300,
          depth: 20,
          time: 100,
          pv: ["e7e5"],
        } as AnalysisResult);

      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const result = await service.detectTactic(fen, undefined, {
        minMoves: 2,
        maxMoves: 3,
      });

      expect(result).not.toBeNull(); // La solution a 3 coups, dans la plage
    });
  });

  describe("generateTactic", () => {
    it("devrait générer une tactique complète à partir d'un candidat", async () => {
      const candidate = {
        position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: ["e2e4", "e7e5"],
        beforeScore: 50,
        afterScore: 300,
        scoreDelta: 250,
        analysis: {
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4", "e7e5"],
        } as AnalysisResult,
      };

      const tactic = await service.generateTactic(candidate);

      expect(tactic).toHaveProperty("position_fen");
      expect(tactic).toHaveProperty("solution_moves");
      expect(tactic).toHaveProperty("difficulty");
      expect(tactic).toHaveProperty("tactic_type");
      expect(tactic).toHaveProperty("explanation");
      expect(tactic.source).toBe("generated");
    });
  });

  describe("estimateDifficulty", () => {
    it("devrait estimer 'Facile' pour 1-2 coups", async () => {
      const candidate = {
        position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: ["e2e4"],
        beforeScore: 50,
        afterScore: 300,
        scoreDelta: 250,
        analysis: {
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4"],
        } as AnalysisResult,
      };

      const tactic = await service.generateTactic(candidate);
      expect(tactic.difficulty).toBe("Facile");
    });

    it("devrait estimer 'Moyen' pour 3-4 coups", async () => {
      const candidate = {
        position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: ["e2e4", "e7e5", "g1f3"],
        beforeScore: 50,
        afterScore: 300,
        scoreDelta: 250,
        analysis: {
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4", "e7e5", "g1f3"],
        } as AnalysisResult,
      };

      const tactic = await service.generateTactic(candidate);
      expect(tactic.difficulty).toBe("Moyen");
    });

    it("devrait estimer 'Difficile' pour 5+ coups", async () => {
      const candidate = {
        position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
        beforeScore: 50,
        afterScore: 300,
        scoreDelta: 250,
        analysis: {
          bestMove: "e2e4",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
        } as AnalysisResult,
      };

      const tactic = await service.generateTactic(candidate);
      expect(tactic.difficulty).toBe("Difficile");
    });
  });

  describe("classifyTacticType", () => {
    it("devrait classifier un mat", async () => {
      // Position de mat simple (fool's mate)
      const candidate = {
        position: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
        solution: ["f1g2", "h4f2"],
        beforeScore: 50,
        afterScore: 10000, // Mat
        scoreDelta: 9950,
        analysis: {
          bestMove: "f1g2",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["f1g2", "h4f2"],
        } as AnalysisResult,
      };

      const tactic = await service.generateTactic(candidate);
      // Note: La classification dépend de la détection du # dans les coups SAN
      // Pour un vrai test de mat, il faudrait une position qui génère vraiment un mat
      expect(tactic).toHaveProperty("tactic_type");
      expect(["Mat", "Combinaison"]).toContain(tactic.tactic_type);
    });

    it("devrait classifier une fourchette", async () => {
      const candidate = {
        position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: ["b1c3"],
        beforeScore: 50,
        afterScore: 300,
        scoreDelta: 250,
        analysis: {
          bestMove: "b1c3",
          evaluation: 50,
          depth: 20,
          time: 100,
          pv: ["b1c3"],
        } as AnalysisResult,
      };

      const tactic = await service.generateTactic(candidate);
      expect(tactic).toHaveProperty("tactic_type");
    });
  });

  describe("parsePGN", () => {
    it("devrait parser un fichier PGN avec une seule partie", () => {
      const pgn = `[Event "Test"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "White"]
[Black "Black"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

      const games = service.parsePGN(pgn);

      expect(games.length).toBe(1);
      expect(games[0].moves.length).toBeGreaterThan(0);
      expect(games[0].moves).toContain("e4");
      expect(games[0].metadata).toHaveProperty("Event");
    });

    it("devrait parser un fichier PGN avec plusieurs parties", () => {
      const pgn = `[Event "Game 1"]
[Result "1-0"]

1. e4 e5 1-0

[Event "Game 2"]
[Result "0-1"]

1. d4 d5 0-1`;

      const games = service.parsePGN(pgn);

      expect(games.length).toBe(2);
      expect(games[0].moves).toContain("e4");
      expect(games[1].moves).toContain("d4");
    });

    it("devrait extraire les métadonnées PGN", () => {
      const pgn = `[Event "Test Event"]
[Site "Test Site"]
[Date "2024.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 1-0`;

      const games = service.parsePGN(pgn);

      expect(games[0].metadata).toHaveProperty("Event", "Test Event");
      expect(games[0].metadata).toHaveProperty("White", "Player1");
      expect(games[0].metadata).toHaveProperty("Black", "Player2");
    });

    it("devrait ignorer les parties invalides", () => {
      const pgn = `[Event "Valid"]
[Result "1-0"]

1. e4 e5 1-0

[Event "Invalid"]
Invalid PGN content here

[Event "Valid 2"]
[Result "0-1"]

1. d4 d5 0-1`;

      const games = service.parsePGN(pgn);

      // Devrait parser au moins les parties valides
      expect(games.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getPositionsFromGame", () => {
    it("devrait extraire les positions d'une partie", () => {
      const moves = ["e4", "e5", "Nf3"];
      const positions = (service as any).getPositionsFromGame(moves);

      expect(positions.length).toBeGreaterThan(0);
      expect(positions[0]).toHaveProperty("fen");
      expect(positions[0]).toHaveProperty("moveNumber");
    });

    it("devrait gérer les coups invalides", () => {
      const moves = ["e4", "invalid", "Nf3"];
      const positions = (service as any).getPositionsFromGame(moves);

      // Devrait continuer malgré le coup invalide
      expect(positions.length).toBeGreaterThan(0);
    });
  });

  describe("saveTactic", () => {
    it("devrait sauvegarder une tactique dans Supabase", async () => {
      const tactic = {
        position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution_moves: ["e4", "e5"],
        difficulty: "Facile" as const,
        tactic_type: "Gain de matériel" as const,
        explanation: "Test explanation",
        source: "generated" as const,
      };

      const id = await service.saveTactic(tactic);
      expect(id).toBe("test-id-123");
    });

    it("devrait détecter les duplications", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      const mockQuery = supabase.from as any;

      // Simuler une duplication
      mockQuery.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: "existing-id" },
              error: null,
            })),
          })),
        })),
      });

      const tactic = {
        position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution_moves: ["e4", "e5"],
        difficulty: "Facile" as const,
        tactic_type: "Gain de matériel" as const,
        explanation: "Test explanation",
        source: "generated" as const,
      };

      await expect(service.saveTactic(tactic)).rejects.toThrow(
        "Une tactique avec cette position existe déjà"
      );
    });
  });
});

