/**
 * Service d'analyse de variantes avec Stockfish
 * Analyse toutes les variantes générées pour obtenir évaluations et suggestions de coups
 */

import { ChessService } from "@/lib/chess/chessService";
import { getStockfishService } from "@/lib/stockfish/stockfishService";
import type {
  VariationNode,
  AnalyzedVariation,
  VariationAnalysisOptions,
  AnalysisResult,
} from "@/types/chess";

/**
 * Cache en mémoire pour les résultats d'analyse
 * Clé: FEN de la position, Valeur: AnalysisResult
 */
const analysisCache = new Map<string, AnalysisResult>();

/**
 * Convertit un coup UCI en notation algébrique (SAN)
 *
 * @param fen - Position FEN avant le coup
 * @param uciMove - Coup en format UCI (ex: "e2e4")
 * @returns Coup en notation algébrique (ex: "e4")
 */
function uciToSan(fen: string, uciMove: string): string {
  try {
    const chess = ChessService.loadPosition(fen);
    const move = chess.move({
      from: uciMove.substring(0, 2) as any,
      to: uciMove.substring(2, 4) as any,
      promotion: uciMove.length > 4 ? (uciMove[4] as any) : undefined,
    });
    return move ? move.san : uciMove;
  } catch (error) {
    // En cas d'erreur, retourner le coup UCI tel quel
    return uciMove;
  }
}

/**
 * Convertit un AnalysisResult en AnalyzedVariation
 *
 * @param variation - Nœud de variante à analyser
 * @param analysis - Résultat d'analyse Stockfish
 * @returns Variante analysée avec toutes les informations
 */
function convertToAnalyzedVariation(
  variation: VariationNode,
  analysis: AnalysisResult
): AnalyzedVariation {
  const bestMoveSan = uciToSan(variation.fen, analysis.bestMove);

  return {
    fen: variation.fen,
    moves: [], // Sera rempli par l'appelant si nécessaire
    evaluation: analysis.evaluation ?? 0,
    bestMove: analysis.bestMove,
    bestMoveSan,
    depth: analysis.depth,
    time: analysis.time,
    pv: analysis.pv,
  };
}

/**
 * Analyse une seule variante avec gestion d'erreur
 *
 * @param variation - Nœud de variante à analyser
 * @param options - Options d'analyse
 * @param cache - Cache à utiliser
 * @returns Variante analysée ou null en cas d'erreur
 */
async function analyzeSingleVariation(
  variation: VariationNode,
  options: {
    depth: number;
    moveTime?: number;
    useCache: boolean;
  },
  cache: Map<string, AnalysisResult>
): Promise<AnalyzedVariation | null> {
  try {
    // Vérifier le cache
    if (options.useCache && cache.has(variation.fen)) {
      const cached = cache.get(variation.fen)!;
      return convertToAnalyzedVariation(variation, cached);
    }

    // Analyser avec Stockfish
    const stockfish = getStockfishService();

    // S'assurer que le moteur est initialisé
    if (!stockfish) {
      throw new Error("StockfishService non disponible");
    }

    // Le moteur devrait déjà être initialisé par analyzeVariations
    // Mais on vérifie quand même pour être sûr
    if (!stockfish.isReady()) {
      await stockfish.initialize();
    }

    const analysis = await stockfish.analyzePosition(variation.fen, {
      depth: options.depth,
      moveTime: options.moveTime,
    });

    // Mettre en cache
    if (options.useCache) {
      cache.set(variation.fen, analysis);
    }

    return convertToAnalyzedVariation(variation, analysis);
  } catch (error) {
    // Logger l'erreur mais continuer avec les autres variantes
    console.error(
      `Erreur lors de l'analyse de la variante ${variation.fen}:`,
      error
    );
    return null;
  }
}

/**
 * Analyse toutes les variantes d'un arbre de variantes
 *
 * Note: Les analyses sont effectuées séquentiellement car Stockfish ne supporte pas
 * les analyses simultanées sur la même instance. Le paramètre maxConcurrentAnalyses
 * est ignoré pour éviter les erreurs "unreachable" dans Stockfish.wasm.
 *
 * @param variations - Array de nœuds de variantes à analyser
 * @param options - Options d'analyse (profondeur, cache, progression, etc.)
 * @returns Array de variantes analysées (peut contenir null pour les échecs)
 *
 * @example
 * ```typescript
 * const tree = generateAllLegalVariations(fen, { maxDepth: 3 });
 * const analyzed = await analyzeVariations(tree.nodes, {
 *   depth: 12,
 *   onProgress: (current, total) => console.log(`${current}/${total}`)
 * });
 * ```
 */
export async function analyzeVariations(
  variations: VariationNode[],
  options: VariationAnalysisOptions = {}
): Promise<AnalyzedVariation[]> {
  const resolvedOptions = {
    depth: options.depth ?? 12,
    moveTime: options.moveTime,
    maxConcurrentAnalyses: options.maxConcurrentAnalyses ?? 3,
    useCache: options.useCache ?? true,
    onProgress: options.onProgress,
  };

  // Initialiser Stockfish avant de commencer les analyses
  const stockfish = getStockfishService();
  try {
    await stockfish.initialize();
  } catch (error) {
    console.warn("Erreur lors de l'initialisation de Stockfish:", error);
    // On continue quand même, peut-être déjà initialisé
  }

  const results: AnalyzedVariation[] = [];

  // Stockfish ne supporte pas les analyses simultanées sur la même instance
  // Traiter les analyses séquentiellement pour éviter les conflits
  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];

    try {
      const analyzed = await analyzeSingleVariation(
        variation,
        resolvedOptions,
        analysisCache
      );

      if (analyzed !== null) {
        results.push(analyzed);
      }
    } catch (error) {
      // Erreur déjà loggée dans analyzeSingleVariation
      console.error(
        `Erreur lors de l'analyse de la variante ${i + 1}/${variations.length}:`,
        error
      );
    }

    // Émettre progression après chaque analyse
    if (resolvedOptions.onProgress) {
      resolvedOptions.onProgress(results.length, variations.length);
    }
  }

  return results;
}

/**
 * Analyse toutes les variantes d'un arbre de variantes (version avec extraction des séquences)
 *
 * @param tree - Arbre de variantes à analyser
 * @param options - Options d'analyse
 * @returns Array de variantes analysées avec leurs séquences de coups
 */
export async function analyzeVariationTree(
  tree: { nodes: VariationNode[]; rootFen: string },
  options: VariationAnalysisOptions = {}
): Promise<AnalyzedVariation[]> {
  // Extraire toutes les positions terminales (feuilles) de l'arbre
  const terminalNodes: VariationNode[] = [];

  function extractTerminalNodes(nodes: VariationNode[]) {
    nodes.forEach((node) => {
      if (node.children.length === 0) {
        terminalNodes.push(node);
      } else {
        extractTerminalNodes(node.children);
      }
    });
  }

  extractTerminalNodes(tree.nodes);

  // Analyser toutes les positions terminales
  return analyzeVariations(terminalNodes, options);
}

/**
 * Invalide le cache d'analyse
 *
 * @param fen - Position FEN à invalider (optionnel, si non fourni, vide tout le cache)
 */
export function invalidateCache(fen?: string): void {
  if (fen) {
    analysisCache.delete(fen);
  } else {
    analysisCache.clear();
  }
}

/**
 * Obtient la taille actuelle du cache
 *
 * @returns Nombre d'entrées dans le cache
 */
export function getCacheSize(): number {
  return analysisCache.size;
}
