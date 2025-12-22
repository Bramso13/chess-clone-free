/**
 * Tests unitaires pour StockfishService
 * Note: Ces tests mockent le loader Stockfish pour éviter les problèmes de dépendances
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { StockfishEngine } from "@/types/chess";

// Mock du moteur Stockfish
const createMockEngine = (): StockfishEngine => ({
  postMessage: vi.fn(),
  onmessage: null,
  terminate: vi.fn(),
});

// Mock du loader avant d'importer le service
vi.mock("@/lib/stockfish/stockfishLoader", () => ({
  loadStockfish: vi.fn(),
}));

describe("StockfishService", () => {
  let StockfishService: any;
  let loadStockfish: any;
  let service: any;
  let mockEngine: StockfishEngine;

  beforeEach(async () => {
    // Réinitialiser les modules
    vi.clearAllMocks();

    // Créer un nouveau mock engine
    mockEngine = createMockEngine();

    // Importer le loader mocké
    const loaderModule = await import("@/lib/stockfish/stockfishLoader");
    loadStockfish = loaderModule.loadStockfish;
    (loadStockfish as any).mockResolvedValue(mockEngine);

    // Importer le service après avoir configuré les mocks
    const serviceModule = await import("@/lib/stockfish/stockfishService");
    StockfishService = serviceModule.StockfishService;

    // Créer une nouvelle instance du service
    service = new StockfishService();
  });

  afterEach(() => {
    if (service) {
      service.terminate();
    }
  });

  describe("Initialization", () => {
    it("vérifie que le moteur n'est pas prêt avant initialisation", () => {
      expect(service.isReady()).toBe(false);
    });

    it("initialise le moteur avec succès", async () => {
      // Simuler les réponses UCI
      const initPromise = service.initialize();

      // Simuler la réponse uciok
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
        }
      }, 10);

      // Simuler la réponse readyok après configuration
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "readyok" } as MessageEvent);
        }
      }, 50);

      await initPromise;

      expect(service.isReady()).toBe(true);
      expect(loadStockfish).toHaveBeenCalledTimes(1);
    });

    it("gère l'erreur si WebAssembly n'est pas supporté", async () => {
      // Sauvegarder WebAssembly original
      const originalWebAssembly = global.WebAssembly;

      // Supprimer WebAssembly temporairement
      // @ts-expect-error - Test de compatibilité
      delete global.WebAssembly;

      await expect(service.initialize()).rejects.toThrow(
        "WebAssembly n'est pas supporté"
      );

      // Restaurer WebAssembly
      global.WebAssembly = originalWebAssembly;
    });

    it("ne réinitialise pas si déjà initialisé", async () => {
      // Première initialisation
      const initPromise1 = service.initialize();
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
          setTimeout(() => {
            if (mockEngine.onmessage) {
              mockEngine.onmessage({ data: "readyok" } as MessageEvent);
            }
          }, 10);
        }
      }, 10);
      await initPromise1;

      const loadCallCount = (loadStockfish as any).mock.calls.length;

      // Deuxième initialisation
      await service.initialize();

      // Le nombre d'appels ne devrait pas augmenter
      expect((loadStockfish as any).mock.calls.length).toBe(loadCallCount);
    });
  });

  describe("getBestMove", () => {
    beforeEach(async () => {
      // Initialiser le moteur avant chaque test
      const initPromise = service.initialize();
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
          setTimeout(() => {
            if (mockEngine.onmessage) {
              mockEngine.onmessage({ data: "readyok" } as MessageEvent);
            }
          }, 10);
        }
      }, 10);
      await initPromise;
    });

    it("retourne le meilleur coup pour une position", async () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      const movePromise = service.getBestMove(fen);

      // Simuler la réponse du moteur
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({
            data: "bestmove e2e4 ponder e7e5",
          } as MessageEvent);
        }
      }, 10);

      const bestMove = await movePromise;

      expect(bestMove).toBe("e2e4");
    });

    it("gère les coups avec promotion", async () => {
      const fen = "8/P7/8/8/8/8/8/8 w - - 0 1";

      const movePromise = service.getBestMove(fen);

      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({
            data: "bestmove a7a8q",
          } as MessageEvent);
        }
      }, 10);

      const bestMove = await movePromise;

      expect(bestMove).toBe("a7a8q");
    });

    it("lance une erreur si le moteur n'est pas initialisé", async () => {
      const uninitializedService = new StockfishService();
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      await expect(uninitializedService.getBestMove(fen)).rejects.toThrow(
        "Le moteur n'est pas initialisé"
      );
    });
  });

  describe("analyzePosition", () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
          setTimeout(() => {
            if (mockEngine.onmessage) {
              mockEngine.onmessage({ data: "readyok" } as MessageEvent);
            }
          }, 10);
        }
      }, 10);
      await initPromise;
    });

    it("analyse une position et retourne les détails", async () => {
      const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

      const analysisPromise = service.analyzePosition(fen);

      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({
            data: "info depth 10 score cp 25 pv e7e5 g1f3 b8c6",
          } as MessageEvent);
          mockEngine.onmessage({
            data: "bestmove e7e5",
          } as MessageEvent);
        }
      }, 10);

      const result = await analysisPromise;

      expect(result.bestMove).toBe("e7e5");
      expect(result.evaluation).toBe(25);
      expect(result.depth).toBe(10);
      expect(result.time).toBeGreaterThan(0);
      expect(result.pv).toEqual(["e7e5", "g1f3", "b8c6"]);
    });

    it("gère l'évaluation en mat", async () => {
      const fen = "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1";

      const analysisPromise = service.analyzePosition(fen);

      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({
            data: "info depth 20 score mate 1",
          } as MessageEvent);
          mockEngine.onmessage({
            data: "bestmove f7f8",
          } as MessageEvent);
        }
      }, 10);

      const result = await analysisPromise;

      expect(result.bestMove).toBe("f7f8");
      expect(result.evaluation).toBe(10000);
    });
  });

  describe("setDifficulty", () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
          setTimeout(() => {
            if (mockEngine.onmessage) {
              mockEngine.onmessage({ data: "readyok" } as MessageEvent);
            }
          }, 10);
        }
      }, 10);
      await initPromise;
    });

    it("lance une erreur si le moteur n'est pas initialisé", async () => {
      const uninitializedService = new StockfishService();

      await expect(
        uninitializedService.setDifficulty("intermediate")
      ).rejects.toThrow("Le moteur n'est pas initialisé");
    });
  });

  describe("terminate", () => {
    it("termine le moteur et libère les ressources", async () => {
      const initPromise = service.initialize();
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
          setTimeout(() => {
            if (mockEngine.onmessage) {
              mockEngine.onmessage({ data: "readyok" } as MessageEvent);
            }
          }, 10);
        }
      }, 10);
      await initPromise;

      expect(service.isReady()).toBe(true);

      service.terminate();

      expect(mockEngine.terminate).toHaveBeenCalled();
      expect(service.isReady()).toBe(false);
    });

    it("peut être appelé plusieurs fois sans erreur", () => {
      service.terminate();
      service.terminate();

      // Ne devrait pas lancer d'erreur
      expect(true).toBe(true);
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({ data: "uciok" } as MessageEvent);
          setTimeout(() => {
            if (mockEngine.onmessage) {
              mockEngine.onmessage({ data: "readyok" } as MessageEvent);
            }
          }, 10);
        }
      }, 10);
      await initPromise;
    });

    it("gère les réponses invalides", async () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      const movePromise = service.getBestMove(fen);

      setTimeout(() => {
        if (mockEngine.onmessage) {
          mockEngine.onmessage({
            data: "invalid response without bestmove",
          } as MessageEvent);
        }
      }, 10);

      await expect(movePromise).rejects.toThrow(
        "Impossible d'extraire le meilleur coup"
      );
    });
  });
});
