/**
 * Tests unitaires pour StockfishVariationAnalyzer
 * Valide l'analyse de variantes avec gestion d'erreur et cache
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { VariationNode, AnalysisResult } from "@/types/chess";
import {
  analyzeVariations,
  analyzeVariationTree,
  invalidateCache,
  getCacheSize,
} from "@/lib/openings/stockfishVariationAnalyzer";

// Mock de StockfishService
const mockAnalyzePosition = vi.fn();

vi.mock("@/lib/stockfish/stockfishService", () => ({
  getStockfishService: vi.fn(() => ({
    analyzePosition: mockAnalyzePosition,
  })),
}));

describe("StockfishVariationAnalyzer", () => {
  const mockVariation: VariationNode = {
    move: "e4",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    depth: 1,
    children: [],
  };

  const mockAnalysisResult: AnalysisResult = {
    bestMove: "e7e5",
    evaluation: 25,
    depth: 12,
    time: 1000,
    pv: ["e7e5", "g1f3"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCache();
    mockAnalyzePosition.mockResolvedValue(mockAnalysisResult);
  });

  /**
   * Scénario 1: Analyse de plusieurs variantes séquentiellement
   */
  describe("analyzeVariations - analyse séquentielle", () => {
    it("devrait analyser plusieurs variantes", async () => {
      const variations: VariationNode[] = [
        mockVariation,
        {
          ...mockVariation,
          move: "d4",
          fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
        },
      ];

      const results = await analyzeVariations(variations, {
        depth: 12,
        maxConcurrentAnalyses: 1,
      });

      expect(results).toHaveLength(2);
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(2);
      results.forEach((result) => {
        expect(result.evaluation).toBe(25);
        expect(result.bestMove).toBe("e7e5");
        expect(result.depth).toBe(12);
      });
    });
  });

  /**
   * Scénario 2: Analyse de plusieurs variantes en parallèle (batch)
   */
  describe("analyzeVariations - analyse parallèle", () => {
    it("devrait analyser plusieurs variantes en parallèle", async () => {
      const variations: VariationNode[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockVariation,
        move: `move${i}`,
        fen: `fen${i}`,
      }));

      const results = await analyzeVariations(variations, {
        depth: 12,
        maxConcurrentAnalyses: 3,
      });

      expect(results).toHaveLength(5);
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(5);
    });
  });

  /**
   * Scénario 3: Cache fonctionne (même position analysée une seule fois)
   */
  describe("analyzeVariations - cache", () => {
    it("devrait utiliser le cache pour positions identiques", async () => {
      const variations: VariationNode[] = [
        mockVariation,
        mockVariation, // Même position
      ];

      const results = await analyzeVariations(variations, {
        depth: 12,
        useCache: true,
      });

      expect(results).toHaveLength(2);
      // Devrait appeler Stockfish une seule fois grâce au cache
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(1);
    });

    it("ne devrait pas utiliser le cache si useCache = false", async () => {
      const variations: VariationNode[] = [
        mockVariation,
        mockVariation,
      ];

      const results = await analyzeVariations(variations, {
        depth: 12,
        useCache: false,
      });

      expect(results).toHaveLength(2);
      // Devrait appeler Stockfish deux fois sans cache
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Scénario 4: Gestion d'erreur (variante invalide ne bloque pas)
   */
  describe("analyzeVariations - gestion d'erreur", () => {
    it("devrait continuer avec autres variantes si une échoue", async () => {
      const variations: VariationNode[] = [
        mockVariation,
        {
          ...mockVariation,
          move: "invalid",
          fen: "invalid fen",
        },
        mockVariation,
      ];

      // Première et troisième analyses réussissent, deuxième échoue
      mockAnalyzePosition
        .mockResolvedValueOnce(mockAnalysisResult)
        .mockRejectedValueOnce(new Error("FEN invalide"))
        .mockResolvedValueOnce(mockAnalysisResult);

      const results = await analyzeVariations(variations, {
        depth: 12,
      });

      // Devrait retourner 2 résultats (les deux réussis)
      expect(results).toHaveLength(2);
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * Scénario 5: Limitation de concurrence respectée
   */
  describe("analyzeVariations - limitation concurrence", () => {
    it("devrait respecter maxConcurrentAnalyses", async () => {
      const variations: VariationNode[] = Array.from({ length: 10 }, (_, i) => ({
        ...mockVariation,
        move: `move${i}`,
        fen: `fen${i}`,
      }));

      let concurrentCount = 0;
      let maxConcurrent = 0;

      mockAnalyzePosition.mockImplementation(async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise((resolve) => setTimeout(resolve, 10));
        concurrentCount--;
        return mockAnalysisResult;
      });

      await analyzeVariations(variations, {
        depth: 12,
        maxConcurrentAnalyses: 3,
      });

      // Le nombre maximum de requêtes simultanées ne devrait pas dépasser 3
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });

  /**
   * Scénario 6: Callback de progression appelé correctement
   */
  describe("analyzeVariations - callback progression", () => {
    it("devrait appeler le callback de progression", async () => {
      const variations: VariationNode[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockVariation,
        move: `move${i}`,
        fen: `fen${i}`,
      }));

      const progressCalls: Array<[number, number]> = [];
      const onProgress = vi.fn((current: number, total: number) => {
        progressCalls.push([current, total]);
      });

      await analyzeVariations(variations, {
        depth: 12,
        maxConcurrentAnalyses: 2,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
      expect(progressCalls.length).toBeGreaterThan(0);
      
      // Vérifier que le dernier appel a current = total
      const lastCall = progressCalls[progressCalls.length - 1];
      expect(lastCall[0]).toBe(5);
      expect(lastCall[1]).toBe(5);
    });
  });

  /**
   * Scénario 7: Résultats contiennent toutes les informations attendues
   */
  describe("analyzeVariations - format résultats", () => {
    it("devrait retourner résultats avec toutes informations", async () => {
      const variations: VariationNode[] = [mockVariation];

      const results = await analyzeVariations(variations, {
        depth: 12,
      });

      expect(results).toHaveLength(1);
      const result = results[0];

      expect(result.fen).toBe(mockVariation.fen);
      expect(result.evaluation).toBe(25);
      expect(result.bestMove).toBe("e7e5");
      expect(result.bestMoveSan).toBeTruthy();
      expect(result.depth).toBe(12);
      expect(result.time).toBe(1000);
      expect(result.pv).toEqual(["e7e5", "g1f3"]);
    });
  });

  /**
   * Scénario 8: Analyse d'un arbre de variantes
   */
  describe("analyzeVariationTree", () => {
    it("devrait analyser toutes les positions terminales d'un arbre", async () => {
      const tree = {
        rootFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        nodes: [
          {
            ...mockVariation,
            children: [
              {
                move: "e5",
                fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
                depth: 2,
                children: [],
              },
            ],
          },
        ],
      };

      const results = await analyzeVariationTree(tree, {
        depth: 12,
      });

      // Devrait analyser uniquement les positions terminales (feuilles)
      expect(results.length).toBeGreaterThan(0);
    });
  });

  /**
   * Scénario 9: Gestion du cache
   */
  describe("Cache management", () => {
    it("invalidateCache devrait vider le cache", async () => {
      const variations: VariationNode[] = [mockVariation];

      // Première analyse
      await analyzeVariations(variations, { useCache: true });
      expect(getCacheSize()).toBe(1);

      // Invalider le cache
      invalidateCache();
      expect(getCacheSize()).toBe(0);

      // Deuxième analyse devrait ré-analyser
      await analyzeVariations(variations, { useCache: true });
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(2);
    });

    it("invalidateCache avec FEN devrait invalider seulement cette position", async () => {
      const variation1: VariationNode = {
        ...mockVariation,
        fen: "fen1",
      };
      const variation2: VariationNode = {
        ...mockVariation,
        fen: "fen2",
      };

      // Analyser les deux
      await analyzeVariations([variation1, variation2], { useCache: true });
      expect(getCacheSize()).toBe(2);

      // Invalider seulement fen1
      invalidateCache("fen1");
      expect(getCacheSize()).toBe(1);

      // Ré-analyser fen1 devrait appeler Stockfish
      await analyzeVariations([variation1], { useCache: true });
      expect(mockAnalyzePosition).toHaveBeenCalledTimes(3);
    });
  });
});

