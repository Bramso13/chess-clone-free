/**
 * Composant StockfishSuggestion
 * Affiche un bouton pour demander une analyse Stockfish et affiche les résultats
 */

import { Chess } from "chess.js";
import { EngineThinkingIndicator } from "@/components/stockfish/EngineThinkingIndicator";
import type { AnalysisResult } from "@/types/chess";

interface StockfishSuggestionProps {
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  error: string | null;
  analysisTime: number;
  currentPosition: string; // FEN de la position actuelle pour la conversion UCI->SAN
  onAnalyze: () => void;
  onPlaySuggestedMove: (move: string) => void;
  onDismiss: () => void;
}

/**
 * Convertit un coup UCI (ex: "e2e4") en notation algébrique (ex: "e4")
 * @param uci - Coup en format UCI
 * @param fen - Position FEN actuelle
 * @returns Coup en notation SAN
 */
function uciToSan(uci: string, fen: string): string {
  if (uci.length < 4) return uci;

  try {
    const game = new Chess(fen);
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;

    const move = game.move({
      from: from as any,
      to: to as any,
      promotion: promotion as any,
    });

    return move ? move.san : uci;
  } catch {
    // En cas d'erreur, retourner le format UCI simplifié
    return uci.substring(2, 4);
  }
}

export function StockfishSuggestion({
  isAnalyzing,
  analysisResult,
  error,
  analysisTime,
  currentPosition,
  onAnalyze,
  onPlaySuggestedMove,
  onDismiss,
}: StockfishSuggestionProps) {
  const hasResult = analysisResult !== null && !error;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Analyse Stockfish
      </h3>

      {/* Indicateur de réflexion */}
      <EngineThinkingIndicator
        thinkingTime={analysisTime}
        visible={isAnalyzing}
      />

      {/* Bouton d'analyse */}
      {!isAnalyzing && !hasResult && (
        <button
          onClick={onAnalyze}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Analyser avec Stockfish
        </button>
      )}

      {/* Résultat de l'analyse */}
      {hasResult && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Meilleur coup suggéré :
              </span>
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-700 text-sm"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-800 font-mono">
                {uciToSan(analysisResult.bestMove, currentPosition)}
              </span>
              <span className="text-xs text-gray-600">
                ({analysisResult.bestMove})
              </span>
            </div>
            {analysisResult.evaluation !== undefined && (
              <div className="mt-2 text-xs text-gray-600">
                Évaluation:{" "}
                {analysisResult.evaluation > 10000
                  ? "Mat"
                  : analysisResult.evaluation < -10000
                  ? "Mat"
                  : `${(analysisResult.evaluation / 100).toFixed(2)} pions`}
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              Profondeur: {analysisResult.depth} • Temps:{" "}
              {(analysisTime / 1000).toFixed(1)}s
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button
              onClick={() => onPlaySuggestedMove(analysisResult.bestMove)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Jouer ce coup
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">Erreur d'analyse</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <button
            onClick={onDismiss}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

