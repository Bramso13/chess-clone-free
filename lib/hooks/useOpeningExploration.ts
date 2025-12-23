/**
 * Hook personnalisé pour gérer l'exploration d'ouvertures
 * Gère la génération de variantes, l'analyse Stockfish, et l'état de navigation
 */

import { useState, useCallback } from "react";
import type {
  VariationTree,
  VariationNode,
  AnalyzedVariation,
  VariationAnalysisOptions,
} from "@/types/chess";
import { generateAllLegalVariations } from "@/lib/openings/openingVariationService";
import {
  analyzeVariations,
  analyzeVariationTree,
} from "@/lib/openings/stockfishVariationAnalyzer";
import { ChessService } from "@/lib/chess/chessService";

/**
 * État de l'exploration d'ouvertures
 */
export interface OpeningExplorationState {
  /** Arbre de variantes généré */
  variationTree: VariationTree | null;
  /** Variantes analysées par Stockfish */
  analyzedVariations: AnalyzedVariation[];
  /** Position FEN actuellement sélectionnée */
  selectedPosition: string | null;
  /** Nœud actuellement sélectionné dans l'arbre */
  selectedNode: VariationNode | null;
  /** État de chargement */
  isGenerating: boolean;
  isAnalyzing: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Progression de l'analyse */
  analysisProgress: { current: number; total: number } | null;
}

/**
 * Actions disponibles pour l'exploration
 */
export interface OpeningExplorationActions {
  /** Générer les variantes à partir d'une position FEN */
  generateVariations: (
    fen: string,
    options?: { maxDepth?: number; maxVariationsPerLevel?: number }
  ) => Promise<void>;
  /** Analyser les variantes avec Stockfish */
  analyzeVariations: (options?: VariationAnalysisOptions) => Promise<void>;
  /** Sélectionner une position dans l'arbre */
  selectPosition: (fen: string, node?: VariationNode) => void;
  /** Réinitialiser l'état */
  reset: () => void;
}

/**
 * Hook pour gérer l'exploration d'ouvertures
 */
export function useOpeningExploration(): OpeningExplorationState &
  OpeningExplorationActions {
  const [state, setState] = useState<OpeningExplorationState>({
    variationTree: null,
    analyzedVariations: [],
    selectedPosition: null,
    selectedNode: null,
    isGenerating: false,
    isAnalyzing: false,
    error: null,
    analysisProgress: null,
  });

  const generateVariations = useCallback(
    async (
      fen: string,
      options: { maxDepth?: number; maxVariationsPerLevel?: number } = {}
    ) => {
      try {
        setState((prev) => ({
          ...prev,
          isGenerating: true,
          error: null,
        }));

        const tree = generateAllLegalVariations(fen, {
          maxDepth: options.maxDepth ?? 3,
          maxVariationsPerLevel: options.maxVariationsPerLevel ?? 15,
        });

        setState((prev) => ({
          ...prev,
          variationTree: tree,
          selectedPosition: fen,
          isGenerating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error:
            error instanceof Error
              ? error.message
              : "Erreur lors de la génération des variantes",
        }));
      }
    },
    []
  );

  const analyzeVariationsAction = useCallback(
    async (options: VariationAnalysisOptions = {}) => {
      if (!state.variationTree) {
        setState((prev) => ({
          ...prev,
          error: "Aucun arbre de variantes à analyser",
        }));
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          isAnalyzing: true,
          error: null,
          analysisProgress: { current: 0, total: 0 },
        }));

        const analyzed = await analyzeVariationTree(
          state.variationTree,
          {
            ...options,
            onProgress: (current, total) => {
              setState((prev) => ({
                ...prev,
                analysisProgress: { current, total },
              }));
              options.onProgress?.(current, total);
            },
          }
        );

        setState((prev) => ({
          ...prev,
          analyzedVariations: analyzed,
          isAnalyzing: false,
          analysisProgress: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error:
            error instanceof Error
              ? error.message
              : "Erreur lors de l'analyse des variantes",
        }));
      }
    },
    [state.variationTree]
  );

  const selectPosition = useCallback((fen: string, node?: VariationNode) => {
    setState((prev) => ({
      ...prev,
      selectedPosition: fen,
      selectedNode: node ?? null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      variationTree: null,
      analyzedVariations: [],
      selectedPosition: null,
      selectedNode: null,
      isGenerating: false,
      isAnalyzing: false,
      error: null,
      analysisProgress: null,
    });
  }, []);

  return {
    ...state,
    generateVariations,
    analyzeVariations: analyzeVariationsAction,
    selectPosition,
    reset,
  };
}

/**
 * Obtient la position FEN initiale d'une ouverture
 * 
 * @param openingMoves - Séquence de coups de l'ouverture
 * @returns Position FEN après avoir joué tous les coups
 */
export function getOpeningPositionFen(openingMoves: string[]): string {
  const chess = ChessService.createGame();
  openingMoves.forEach((move) => {
    try {
      ChessService.makeMove(chess, move);
    } catch (error) {
      console.warn(`Coup invalide dans l'ouverture: ${move}`, error);
    }
  });
  return chess.fen();
}

