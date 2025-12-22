/**
 * Hook personnalisé pour gérer une partie contre Stockfish
 * Gère l'état de la partie, les tours, et l'interaction avec le moteur
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import type { Move } from "@/types/chess";
import { getStockfishService } from "@/lib/stockfish/stockfishService";
import type { DifficultyLevel } from "@/types/chess";

type GameState = "player_turn" | "engine_thinking" | "game_over";
type GameResult = "checkmate_white" | "checkmate_black" | "draw" | "stalemate";

interface UseStockfishGameParams {
  difficulty: DifficultyLevel;
  playerColor: "white" | "black";
}

interface UseStockfishGameReturn {
  // État du jeu
  position: string;
  history: string[];
  gameState: GameState;
  gameResult: GameResult | null;
  engineThinkingTime: number;
  winner: "white" | "black" | "draw" | null;

  // Actions
  makePlayerMove: (move: Move) => boolean;
  undoMove: () => void;
  newGame: () => void;

  // Computed
  isPlayerTurn: boolean;
  canUndo: boolean;
}

export function useStockfishGame(
  params: UseStockfishGameParams
): UseStockfishGameReturn {
  const { difficulty, playerColor } = params;

  // Référence au jeu chess.js
  const gameRef = useRef<Chess>(new Chess());

  // État
  const [position, setPosition] = useState<string>(gameRef.current.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("engine_thinking"); // Commence en "thinking" pendant l'init
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [engineThinkingTime, setEngineThinkingTime] = useState<number>(0);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const thinkingStartTimeRef = useRef<number | null>(null);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser Stockfish
  useEffect(() => {
    const initStockfish = async () => {
      try {
        const stockfish = getStockfishService();
        await stockfish.initialize();
        await stockfish.setDifficulty(difficulty);
        setIsEngineReady(true);
        
        // Une fois prêt, définir le bon état initial
        if (playerColor === "white") {
          setGameState("player_turn");
        } else {
          setGameState("engine_thinking");
        }
      } catch (error) {
        console.error("Erreur d'initialisation Stockfish:", error);
        setGameState("player_turn"); // Fallback
      }
    };

    initStockfish();

    // Cleanup
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, [difficulty]);

  // Si c'est le tour de Stockfish au démarrage, jouer quand le moteur est prêt
  useEffect(() => {
    if (isEngineReady && playerColor === "black" && gameState === "engine_thinking") {
      playEngineMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngineReady]);

  /**
   * Vérifie si la partie est terminée
   */
  const checkGameOver = useCallback((): boolean => {
    const game = gameRef.current;

    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "black" : "white";
      setGameResult(
        winner === "white" ? "checkmate_white" : "checkmate_black"
      );
      setGameState("game_over");
      return true;
    }

    if (game.isDraw()) {
      setGameResult("draw");
      setGameState("game_over");
      return true;
    }

    if (game.isStalemate()) {
      setGameResult("stalemate");
      setGameState("game_over");
      return true;
    }

    return false;
  }, []);

  /**
   * Démarre le chronomètre de réflexion
   */
  const startThinkingTimer = useCallback(() => {
    thinkingStartTimeRef.current = Date.now();
    setEngineThinkingTime(0);

    thinkingIntervalRef.current = setInterval(() => {
      if (thinkingStartTimeRef.current) {
        setEngineThinkingTime(Date.now() - thinkingStartTimeRef.current);
      }
    }, 100);
  }, []);

  /**
   * Arrête le chronomètre de réflexion
   */
  const stopThinkingTimer = useCallback(() => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    thinkingStartTimeRef.current = null;
  }, []);

  /**
   * Convertit un coup UCI en SAN
   */
  const uciToSan = useCallback((uciMove: string): string => {
    const game = gameRef.current;
    const from = uciMove.substring(0, 2) as Move["from"];
    const to = uciMove.substring(2, 4) as Move["to"];
    const promotion = uciMove.substring(4, 5) as Move["promotion"];

    try {
      const move = game.move({ from, to, promotion: promotion || undefined });
      // Annuler le coup immédiatement pour juste obtenir la notation
      game.undo();
      return move ? move.san : uciMove;
    } catch {
      return uciMove;
    }
  }, []);

  /**
   * Joue un coup du moteur
   */
  const playEngineMove = useCallback(async () => {
    setGameState("engine_thinking");
    startThinkingTimer();

    try {
      const stockfish = getStockfishService();
      const currentFen = gameRef.current.fen();

      // Obtenir le meilleur coup avec timeout
      const bestMove = await Promise.race([
        stockfish.getBestMove(currentFen),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ]);

      stopThinkingTimer();

      // Convertir UCI en Move
      const from = bestMove.substring(0, 2) as Move["from"];
      const to = bestMove.substring(2, 4) as Move["to"];
      const promotion = bestMove.substring(4, 5) as Move["promotion"];

      // Jouer le coup
      const move = gameRef.current.move({
        from,
        to,
        promotion: promotion || undefined,
      });

      if (move) {
        setPosition(gameRef.current.fen());
        setHistory((prev) => [...prev, move.san]);

        // Vérifier fin de partie
        if (!checkGameOver()) {
          setGameState("player_turn");
        }
      }
    } catch (error) {
      console.error("Erreur lors du coup de Stockfish:", error);
      stopThinkingTimer();
      setGameState("player_turn");
    }
  }, [startThinkingTimer, stopThinkingTimer, checkGameOver]);

  /**
   * Joue un coup du joueur
   */
  const makePlayerMove = useCallback(
    (move: Move): boolean => {
      if (gameState !== "player_turn" || !isEngineReady) {
        return false;
      }

      try {
        const result = gameRef.current.move(move);

        if (result) {
          setPosition(gameRef.current.fen());
          setHistory((prev) => [...prev, result.san]);

          // Vérifier fin de partie
          if (!checkGameOver()) {
            // Tour de Stockfish
            playEngineMove();
          }

          return true;
        }

        return false;
      } catch (error) {
        console.error("Coup invalide:", error);
        return false;
      }
    },
    [gameState, isEngineReady, checkGameOver, playEngineMove]
  );

  /**
   * Annule le dernier coup (joueur + moteur)
   */
  const undoMove = useCallback(() => {
    if (gameState !== "player_turn" || history.length < 2) {
      return;
    }

    // Annuler 2 coups (joueur + moteur)
    gameRef.current.undo(); // Dernier coup du moteur
    gameRef.current.undo(); // Dernier coup du joueur

    setPosition(gameRef.current.fen());
    setHistory((prev) => prev.slice(0, -2));
    setGameState("player_turn");
  }, [gameState, history.length]);

  /**
   * Nouvelle partie
   */
  const newGame = useCallback(() => {
    gameRef.current = new Chess();
    setPosition(gameRef.current.fen());
    setHistory([]);
    setGameResult(null);
    setEngineThinkingTime(0);

    const initialState =
      isEngineReady && playerColor === "white" ? "player_turn" : "engine_thinking";
    setGameState(initialState);

    // Si c'est Stockfish qui commence et que le moteur est prêt
    if (isEngineReady && playerColor === "black") {
      setTimeout(() => playEngineMove(), 500);
    }
  }, [playerColor, isEngineReady, playEngineMove]);

  // Calculer les valeurs dérivées
  const isPlayerTurn = gameState === "player_turn";
  const canUndo = gameState === "player_turn" && history.length >= 2;
  
  const winner =
    gameResult === "checkmate_white"
      ? "white"
      : gameResult === "checkmate_black"
        ? "black"
        : gameResult === "draw" || gameResult === "stalemate"
          ? "draw"
          : null;

  return {
    position,
    history,
    gameState,
    gameResult,
    engineThinkingTime,
    winner,
    makePlayerMove,
    undoMove,
    newGame,
    isPlayerTurn,
    canUndo,
  };
}

