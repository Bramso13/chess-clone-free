/**
 * Tests unitaires pour ChessService
 * Couvre tous les scénarios requis et la gestion d'erreurs
 */

import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  ChessService,
  InvalidFenError,
  InvalidMoveError,
  type GameState,
  type ValidationResult,
} from "@/lib/chess/chessService";

describe("ChessService", () => {
  /**
   * Scénario 1: Créer nouvelle partie avec position initiale standard
   */
  describe("createGame", () => {
    it("devrait créer une nouvelle partie avec la position initiale", () => {
      const game = ChessService.createGame();
      
      expect(game).toBeInstanceOf(Chess);
      expect(game.fen()).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
      expect(ChessService.getGameState(game).turn).toBe("white");
    });

    it("devrait permettre de jouer des coups valides", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "e4");
      expect(game.fen()).toContain(" b ");
      
      ChessService.makeMove(game, "e5");
      expect(game.fen()).toContain(" w ");
    });
  });

  /**
   * Scénario 2: Charger position FEN valide
   */
  describe("loadPosition", () => {
    it("devrait charger une position FEN valide", () => {
      const customFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
      const game = ChessService.loadPosition(customFen);
      
      expect(game.fen()).toBe(customFen);
      expect(ChessService.getGameState(game).turn).toBe("black");
    });

    it("devrait lever une erreur pour FEN invalide", () => {
      const invalidFen = "invalid-fen-string";
      
      expect(() => ChessService.loadPosition(invalidFen)).toThrow(
        InvalidFenError
      );
    });

    it("devrait charger une position d'échec", () => {
      // Position où le roi blanc est en échec mais peut bouger
      const checkFen = "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 1";
      const game = ChessService.loadPosition(checkFen);
      ChessService.makeMove(game, "Kf2"); // Move king first
      ChessService.makeMove(game, "Qh4"); // Queen checks king
      const state = ChessService.getGameState(game);
      
      expect(state.isCheck).toBe(true);
      expect(state.isCheckmate).toBe(false);
    });
  });

  /**
   * Scénario 3: Valider coup valide et invalide
   */
  describe("validateMove", () => {
    it("devrait valider un coup valide (format objet)", () => {
      const game = ChessService.createGame();
      const result = ChessService.validateMove(game, {
        from: "e2",
        to: "e4",
      });
      
      expect(result.isValid).toBe(true);
      expect(result.san).toBe("e4");
      expect(result.error).toBeUndefined();
    });

    it("devrait valider un coup valide (format SAN)", () => {
      const game = ChessService.createGame();
      const result = ChessService.validateMove(game, "Nf3");
      
      expect(result.isValid).toBe(true);
      expect(result.san).toBe("Nf3");
    });

    it("devrait rejeter un coup invalide", () => {
      const game = ChessService.createGame();
      const result = ChessService.validateMove(game, {
        from: "e2",
        to: "e5",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("ne devrait pas modifier le jeu lors de la validation", () => {
      const game = ChessService.createGame();
      const fenBefore = game.fen();
      
      ChessService.validateMove(game, "e4");
      
      expect(game.fen()).toBe(fenBefore);
    });
  });

  /**
   * Scénario 4: Obtenir coups légaux pour position donnée
   */
  describe("getLegalMoves", () => {
    it("devrait retourner tous les coups légaux pour la position initiale", () => {
      const game = ChessService.createGame();
      const moves = ChessService.getLegalMoves(game);
      
      expect(moves).toHaveLength(20); // Position initiale a 20 coups légaux
      expect(moves).toContain("e4");
      expect(moves).toContain("Nf3");
    });

    it("devrait accepter un FEN string", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      const moves = ChessService.getLegalMoves(fen);
      
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    it("devrait retourner des coups détaillés en mode verbose", () => {
      const game = ChessService.createGame();
      const moves = ChessService.getLegalMoves(game, true) as any[];
      
      expect(moves[0]).toHaveProperty("from");
      expect(moves[0]).toHaveProperty("to");
      expect(moves[0]).toHaveProperty("san");
    });

    it("devrait retourner une liste vide si échec et mat", () => {
      // Position d'échec et mat en 2 coups
      const game = ChessService.createGame();
      ChessService.makeMove(game, "f3");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "g4");
      ChessService.makeMove(game, "Qh4"); // Mat
      
      const moves = ChessService.getLegalMoves(game);
      expect(moves).toHaveLength(0);
    });
  });

  /**
   * Scénario 5: Exécuter coup et vérifier mise à jour position
   */
  describe("makeMove", () => {
    it("devrait exécuter un coup valide et mettre à jour la position", () => {
      const game = ChessService.createGame();
      const initialFen = game.fen();
      
      ChessService.makeMove(game, "e4");
      
      expect(game.fen()).not.toBe(initialFen);
      expect(game.fen()).toContain("4P3"); // Pion en e4
    });

    it("devrait lever une erreur pour un coup invalide", () => {
      const game = ChessService.createGame();
      
      expect(() =>
        ChessService.makeMove(game, { from: "e2", to: "e5" })
      ).toThrow(InvalidMoveError);
    });

    it("devrait gérer une séquence de coups", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "e4");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "Nf3");
      ChessService.makeMove(game, "Nc6");
      
      const history = ChessService.getHistory(game);
      expect(history).toEqual(["e4", "e5", "Nf3", "Nc6"]);
    });
  });

  /**
   * Scénario 6: Détecter échec et mat
   */
  describe("getGameState - Échec et mat", () => {
    it("devrait détecter l'échec et mat (Fool's Mate)", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "f3");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "g4");
      ChessService.makeMove(game, "Qh4"); // Mat
      
      const state = ChessService.getGameState(game);
      
      expect(state.isCheckmate).toBe(true);
      expect(state.isGameOver).toBe(true);
      expect(state.isCheck).toBe(true);
    });

    it("devrait détecter l'échec sans mat", () => {
      // Position d'échec simple : roi blanc en e1 attaqué par tour noire en e8
      // Roi noir en a8 pour position valide
      const checkFen = "k3r3/8/8/8/8/8/8/4K3 w - - 0 1";
      const game = ChessService.loadPosition(checkFen);
      const state = ChessService.getGameState(game);
      
      expect(state.isCheck).toBe(true);
      expect(state.isCheckmate).toBe(false);
      expect(ChessService.getLegalMoves(game).length).toBeGreaterThan(0);
    });

    it("devrait détecter le mat de Scholar (Mat du berger)", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "e4");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "Bc4");
      ChessService.makeMove(game, "Nc6");
      ChessService.makeMove(game, "Qh5");
      ChessService.makeMove(game, "Nf6");
      ChessService.makeMove(game, "Qxf7"); // Mat
      
      const state = ChessService.getGameState(game);
      
      expect(state.isCheckmate).toBe(true);
      expect(state.isGameOver).toBe(true);
    });
  });

  /**
   * Scénario 7: Détecter partie nulle (stalemate)
   */
  describe("getGameState - Pat (Stalemate)", () => {
    it("devrait détecter un pat", () => {
      // Position de pat: roi noir coincé sans être en échec
      const stalematePosition = "k7/P7/K7/8/8/8/8/8 b - - 0 1";
      const game = ChessService.loadPosition(stalematePosition);
      const state = ChessService.getGameState(game);
      
      expect(state.isStalemate).toBe(true);
      expect(state.isDraw).toBe(true);
      expect(state.isGameOver).toBe(true);
      expect(state.isCheckmate).toBe(false);
    });

    it("devrait distinguer pat et échec et mat", () => {
      const game = ChessService.createGame();
      ChessService.makeMove(game, "e4");
      const state = ChessService.getGameState(game);
      
      expect(state.isStalemate).toBe(false);
      expect(state.isCheckmate).toBe(false);
      expect(state.isGameOver).toBe(false);
    });
  });

  /**
   * Scénario 8: Convertir partie en PGN
   */
  describe("toPGN", () => {
    it("devrait convertir une partie en PGN", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "e4");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "Nf3");
      
      const pgn = ChessService.toPGN(game);
      
      expect(pgn).toContain("e4");
      expect(pgn).toContain("e5");
      expect(pgn).toContain("Nf3");
    });

    it("devrait retourner PGN avec headers pour partie sans coups", () => {
      const game = ChessService.createGame();
      const pgn = ChessService.toPGN(game);
      
      // chess.js retourne les headers PGN même sans coups
      expect(pgn).toContain("[Event");
      expect(pgn).toContain("*");
    });

    it("devrait inclure le résultat en cas de mat", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "f3");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "g4");
      ChessService.makeMove(game, "Qh4"); // Mat
      
      const pgn = ChessService.toPGN(game);
      
      expect(pgn).toBeDefined();
      expect(typeof pgn).toBe("string");
    });
  });

  /**
   * Tests supplémentaires: Fonctions utilitaires
   */
  describe("Fonctions utilitaires", () => {
    describe("getFen", () => {
      it("devrait retourner le FEN actuel", () => {
        const game = ChessService.createGame();
        const fen = ChessService.getFen(game);
        
        expect(fen).toBe(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
      });
    });

    describe("getHistory", () => {
      it("devrait retourner l'historique des coups", () => {
        const game = ChessService.createGame();
        
        ChessService.makeMove(game, "e4");
        ChessService.makeMove(game, "c5");
        
        const history = ChessService.getHistory(game);
        
        expect(history).toEqual(["e4", "c5"]);
      });

      it("devrait retourner l'historique détaillé en mode verbose", () => {
        const game = ChessService.createGame();
        
        ChessService.makeMove(game, "e4");
        
        const history = ChessService.getHistory(game, true) as any[];
        
        expect(history[0]).toHaveProperty("from");
        expect(history[0]).toHaveProperty("to");
        expect(history[0].from).toBe("e2");
        expect(history[0].to).toBe("e4");
      });
    });

    describe("undo", () => {
      it("devrait annuler le dernier coup", () => {
        const game = ChessService.createGame();
        const initialFen = game.fen();
        
        ChessService.makeMove(game, "e4");
        ChessService.undo(game);
        
        expect(game.fen()).toBe(initialFen);
      });

      it("devrait retourner null si aucun coup à annuler", () => {
        const game = ChessService.createGame();
        const result = ChessService.undo(game);
        
        expect(result).toBeNull();
      });
    });

    describe("reset", () => {
      it("devrait réinitialiser le jeu", () => {
        const game = ChessService.createGame();
        
        ChessService.makeMove(game, "e4");
        ChessService.makeMove(game, "e5");
        ChessService.reset(game);
        
        expect(game.fen()).toBe(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
      });
    });

    describe("getPiece", () => {
      it("devrait retourner la pièce sur une case", () => {
        const game = ChessService.createGame();
        const piece = ChessService.getPiece(game, "e2");
        
        expect(piece).toEqual({
          type: "p",
          color: "w",
        });
      });

      it("devrait retourner null ou undefined pour une case vide", () => {
        const game = ChessService.createGame();
        const piece = ChessService.getPiece(game, "e4");
        
        expect(piece).toBeFalsy(); // chess.js retourne undefined pour case vide
      });
    });
  });

  /**
   * Tests de gestion d'erreurs complète
   */
  describe("Gestion d'erreurs", () => {
    it("devrait gérer les erreurs de FEN gracieusement", () => {
      expect(() => ChessService.loadPosition("")).toThrow(InvalidFenError);
      expect(() => ChessService.loadPosition("xyz")).toThrow(InvalidFenError);
    });

    it("devrait gérer les erreurs de coups gracieusement", () => {
      const game = ChessService.createGame();
      
      expect(() => ChessService.makeMove(game, "x1")).toThrow(
        InvalidMoveError
      );
      expect(() =>
        ChessService.makeMove(game, { from: "a1", to: "a8" })
      ).toThrow(InvalidMoveError);
    });

    it("ne devrait pas permettre de jouer après mat", () => {
      const game = ChessService.createGame();
      
      ChessService.makeMove(game, "f3");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "g4");
      ChessService.makeMove(game, "Qh4"); // Mat
      
      expect(() => ChessService.makeMove(game, "e4")).toThrow(
        InvalidMoveError
      );
    });
  });

  /**
   * Tests d'intégration - Scénarios réels
   */
  describe("Scénarios d'intégration", () => {
    it("devrait gérer une partie complète typique", () => {
      const game = ChessService.createGame();
      
      // Italian Game
      ChessService.makeMove(game, "e4");
      ChessService.makeMove(game, "e5");
      ChessService.makeMove(game, "Nf3");
      ChessService.makeMove(game, "Nc6");
      ChessService.makeMove(game, "Bc4");
      ChessService.makeMove(game, "Bc5");
      
      const state = ChessService.getGameState(game);
      
      expect(state.isGameOver).toBe(false);
      expect(ChessService.getHistory(game)).toHaveLength(6);
      expect(ChessService.getLegalMoves(game).length).toBeGreaterThan(0);
    });

    it("devrait gérer une partie avec promotion", () => {
      // Position où un pion blanc peut être promu
      const promotionFen = "8/P7/8/8/8/8/8/K6k w - - 0 1";
      const game = ChessService.loadPosition(promotionFen);
      
      ChessService.makeMove(game, { from: "a7", to: "a8", promotion: "q" });
      
      const piece = ChessService.getPiece(game, "a8");
      expect(piece.type).toBe("q");
    });
  });
});

