/**
 * Service de logique d'échecs centralisé
 * Utilise chess.js comme source de vérité unique pour toutes les règles du jeu
 */

import { Chess } from "chess.js";
import type { Move } from "@/types/chess";

/**
 * État du jeu incluant toutes les informations de partie
 */
export interface GameState {
  /** Position FEN actuelle */
  fen: string;
  /** Indique si le roi est en échec */
  isCheck: boolean;
  /** Indique si c'est échec et mat */
  isCheckmate: boolean;
  /** Indique si c'est un pat (stalemate) */
  isStalemate: boolean;
  /** Indique si la partie est nulle */
  isDraw: boolean;
  /** Tour du joueur ('white' ou 'black') */
  turn: "white" | "black";
  /** Indique si la partie est terminée */
  isGameOver: boolean;
}

/**
 * Résultat de validation d'un coup
 */
export interface ValidationResult {
  /** Indique si le coup est valide */
  isValid: boolean;
  /** Message d'erreur si le coup est invalide */
  error?: string;
  /** Coup validé au format SAN si valide */
  san?: string;
}

/**
 * Erreur personnalisée pour FEN invalide
 */
export class InvalidFenError extends Error {
  constructor(fen: string) {
    super(`Position FEN invalide: ${fen}`);
    this.name = "InvalidFenError";
  }
}

/**
 * Erreur personnalisée pour coup invalide
 */
export class InvalidMoveError extends Error {
  constructor(move: string) {
    super(`Coup invalide: ${move}`);
    this.name = "InvalidMoveError";
  }
}

/**
 * Service de logique d'échecs
 * Fournit une interface unifiée pour toutes les opérations de jeu d'échecs
 */
export class ChessService {
  /**
   * Crée une nouvelle partie d'échecs avec la position initiale standard
   * @returns Instance Chess initialisée avec la position de départ
   * @example
   * const game = ChessService.createGame();
   * console.log(game.fen()); // Position initiale
   */
  static createGame(): Chess {
    return new Chess();
  }

  /**
   * Charge une position d'échecs depuis une chaîne FEN
   * @param fen - Chaîne FEN représentant la position
   * @returns Instance Chess avec la position chargée
   * @throws {InvalidFenError} Si la chaîne FEN est invalide
   * @example
   * const game = ChessService.loadPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
   */
  static loadPosition(fen: string): Chess {
    try {
      const game = new Chess(fen);
      return game;
    } catch (error) {
      throw new InvalidFenError(fen);
    }
  }

  /**
   * Valide un coup sans l'exécuter
   * @param game - Instance Chess représentant la partie
   * @param move - Coup à valider (format SAN ou objet Move)
   * @returns Résultat de validation avec détails
   * @example
   * const game = ChessService.createGame();
   * const result = ChessService.validateMove(game, { from: 'e2', to: 'e4' });
   * console.log(result.isValid); // true
   */
  static validateMove(
    game: Chess,
    move: Move | string
  ): ValidationResult {
    try {
      // Créer une copie du jeu pour tester le coup sans modifier l'original
      const testGame = new Chess(game.fen());
      
      const result = testGame.move(move as any);
      
      if (result === null) {
        return {
          isValid: false,
          error: `Coup invalide: ${JSON.stringify(move)}`,
        };
      }

      return {
        isValid: true,
        san: result.san,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Obtient tous les coups légaux pour la position actuelle
   * @param game - Instance Chess ou chaîne FEN
   * @param verbose - Si true, retourne les coups avec détails (format objet)
   * @returns Array de coups au format SAN ou objets détaillés
   * @example
   * const game = ChessService.createGame();
   * const moves = ChessService.getLegalMoves(game);
   * console.log(moves); // ['a3', 'a4', 'b3', 'b4', ...]
   */
  static getLegalMoves(
    game: Chess | string,
    verbose: boolean = false
  ): string[] | any[] {
    const chessGame = typeof game === "string" 
      ? ChessService.loadPosition(game) 
      : game;
    
    return chessGame.moves({ verbose });
  }

  /**
   * Exécute un coup sur le jeu
   * @param game - Instance Chess représentant la partie
   * @param move - Coup à exécuter (format SAN ou objet Move)
   * @returns Instance Chess modifiée (mutation en place)
   * @throws {InvalidMoveError} Si le coup est invalide
   * @example
   * const game = ChessService.createGame();
   * ChessService.makeMove(game, { from: 'e2', to: 'e4' });
   * console.log(game.fen()); // Position après le coup
   */
  static makeMove(game: Chess, move: Move | string): Chess {
    try {
      const result = game.move(move as any);
      
      if (result === null) {
        throw new InvalidMoveError(JSON.stringify(move));
      }
      
      return game;
    } catch (error) {
      if (error instanceof InvalidMoveError) {
        throw error;
      }
      throw new InvalidMoveError(
        error instanceof Error ? error.message : JSON.stringify(move)
      );
    }
  }

  /**
   * Convertit la partie en notation PGN (Portable Game Notation)
   * @param game - Instance Chess représentant la partie
   * @returns Chaîne PGN formatée
   * @example
   * const game = ChessService.createGame();
   * ChessService.makeMove(game, 'e4');
   * const pgn = ChessService.toPGN(game);
   * console.log(pgn); // "1. e4"
   */
  static toPGN(game: Chess): string {
    return game.pgn();
  }

  /**
   * Obtient la position FEN actuelle du jeu
   * @param game - Instance Chess représentant la partie
   * @returns Chaîne FEN de la position actuelle
   * @example
   * const game = ChessService.createGame();
   * const fen = ChessService.getFen(game);
   */
  static getFen(game: Chess): string {
    return game.fen();
  }

  /**
   * Obtient l'état complet du jeu
   * @param game - Instance Chess représentant la partie
   * @returns Objet GameState avec tous les détails de l'état
   * @example
   * const game = ChessService.createGame();
   * const state = ChessService.getGameState(game);
   * console.log(state.turn); // 'white'
   */
  static getGameState(game: Chess): GameState {
    return {
      fen: game.fen(),
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
      isDraw: game.isDraw(),
      turn: game.turn() === "w" ? "white" : "black",
      isGameOver: game.isGameOver(),
    };
  }

  /**
   * Obtient l'historique complet des coups joués
   * @param game - Instance Chess représentant la partie
   * @param verbose - Si true, retourne les coups avec détails
   * @returns Array de coups au format SAN ou objets détaillés
   * @example
   * const game = ChessService.createGame();
   * ChessService.makeMove(game, 'e4');
   * ChessService.makeMove(game, 'e5');
   * const history = ChessService.getHistory(game);
   * console.log(history); // ['e4', 'e5']
   */
  static getHistory(game: Chess, verbose: boolean = false): string[] | any[] {
    return game.history({ verbose });
  }

  /**
   * Annule le dernier coup joué
   * @param game - Instance Chess représentant la partie
   * @returns Coup annulé ou null si aucun coup à annuler
   * @example
   * const game = ChessService.createGame();
   * ChessService.makeMove(game, 'e4');
   * const undone = ChessService.undo(game);
   * console.log(undone.san); // 'e4'
   */
  static undo(game: Chess): any {
    return game.undo();
  }

  /**
   * Réinitialise le jeu à la position initiale
   * @param game - Instance Chess représentant la partie
   * @example
   * const game = ChessService.createGame();
   * ChessService.makeMove(game, 'e4');
   * ChessService.reset(game);
   * console.log(game.fen()); // Position initiale
   */
  static reset(game: Chess): void {
    game.reset();
  }

  /**
   * Obtient la pièce présente sur une case
   * @param game - Instance Chess représentant la partie
   * @param square - Case à vérifier (notation algébrique)
   * @returns Objet représentant la pièce ou null si case vide
   * @example
   * const game = ChessService.createGame();
   * const piece = ChessService.getPiece(game, 'e2');
   * console.log(piece); // { type: 'p', color: 'w' }
   */
  static getPiece(game: Chess, square: string): any {
    return game.get(square as any);
  }
}

