/**
 * Hook personnalisé pour l'analyse Stockfish à la demande
 * Permet d'analyser une position et obtenir le meilleur coup suggéré
 */

import { useState, useCallback, useRef } from "react";
import { getStockfishService } from "@/lib/stockfish/stockfishService";
import type { AnalysisResult } from "@/types/chess";

interface UseStockfishAnalysisReturn {
  // État de l'analyse
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  error: string | null;
  analysisTime: number;

  // Actions
  analyzePosition: (fen: string, depth?: number) => Promise<void>;
  cancelAnalysis: () => void;
  clearAnalysis: () => void;
}

/**
 * Hook pour l'analyse Stockfish à la demande
 */
export function useStockfishAnalysis(): UseStockfishAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState<number>(0);

  // Référence pour permettre l'annulation
  const cancelRef = useRef(false);

  /**
   * Analyse une position avec Stockfish
   * @param fen - Position FEN à analyser
   * @param depth - Profondeur d'analyse (défaut: 12 pour réponse rapide)
   */
  const analyzePosition = useCallback(
    async (fen: string, depth: number = 12) => {
      // Réinitialiser l'état
      setError(null);
      setAnalysisResult(null);
      setIsAnalyzing(true);
      setAnalysisTime(0);
      cancelRef.current = false;

      const startTime = Date.now();

      try {
        const stockfish = getStockfishService();

        // Vérifier que Stockfish est prêt
        if (!stockfish.isReady()) {
          await stockfish.initialize();
        }

        // Vérifier si l'analyse a été annulée
        if (cancelRef.current) {
          return;
        }

        // Analyser la position
        const result = await stockfish.analyzePosition(fen, {
          depth,
        });

        // Vérifier à nouveau si annulé
        if (cancelRef.current) {
          return;
        }

        const elapsedTime = Date.now() - startTime;

        setAnalysisResult(result);
        setAnalysisTime(elapsedTime);
        setIsAnalyzing(false);
      } catch (err) {
        if (cancelRef.current) {
          // Annulation, ne pas afficher d'erreur
          setIsAnalyzing(false);
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur inconnue lors de l'analyse";
        setError(errorMessage);
        setIsAnalyzing(false);
        setAnalysisTime(0);
      }
    },
    []
  );

  /**
   * Annule l'analyse en cours
   */
  const cancelAnalysis = useCallback(() => {
    cancelRef.current = true;
    setIsAnalyzing(false);
    setError(null);
  }, []);

  /**
   * Efface les résultats de l'analyse
   */
  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setAnalysisTime(0);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analysisTime,
    analyzePosition,
    cancelAnalysis,
    clearAnalysis,
  };
}

