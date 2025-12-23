/**
 * Service de génération de variantes d'ouvertures
 * Génère toutes les variantes légales possibles à partir d'une position d'échecs donnée
 */

import { ChessService } from "@/lib/chess/chessService";
import type { VariationNode, VariationTree } from "@/types/chess";

/**
 * Options pour la génération de variantes
 */
export interface VariationGenerationOptions {
  /** Profondeur maximale à explorer (défaut: 3) */
  maxDepth?: number;
  /** Nombre maximum de variantes par niveau pour éviter explosion combinatoire (défaut: 15) */
  maxVariationsPerLevel?: number;
}

/**
 * Génère toutes les variantes légales possibles à partir d'une position FEN
 *
 * @param fen - Position FEN de départ
 * @param options - Options de génération (profondeur max, limite de variantes)
 * @returns Arbre de variantes avec toutes les branches possibles
 *
 * @example
 * ```typescript
 * const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
 * const tree = generateAllLegalVariations(fen, { maxDepth: 3, maxVariationsPerLevel: 10 });
 * console.log(tree.nodes.length); // Nombre de nœuds générés
 * ```
 */
export function generateAllLegalVariations(
  fen: string,
  options: VariationGenerationOptions = {}
): VariationTree {
  const maxDepth = options.maxDepth ?? 3;
  const maxVariationsPerLevel = options.maxVariationsPerLevel ?? 15;

  // Générer les nœuds récursivement
  const nodes = generateVariationsRecursive(
    fen,
    0,
    maxDepth,
    [],
    maxVariationsPerLevel
  );

  return {
    rootFen: fen,
    maxDepth,
    nodes,
  };
}

/**
 * Génère récursivement les variantes à partir d'une position
 *
 * @param fen - Position FEN actuelle
 * @param currentDepth - Profondeur actuelle dans l'arbre
 * @param maxDepth - Profondeur maximale à atteindre
 * @param currentPath - Chemin de coups depuis la position initiale
 * @param maxVariationsPerLevel - Nombre maximum de variantes à explorer par niveau
 * @returns Array de nœuds de variantes
 */
function generateVariationsRecursive(
  fen: string,
  currentDepth: number,
  maxDepth: number,
  currentPath: string[],
  maxVariationsPerLevel: number
): VariationNode[] {
  // Arrêt si profondeur maximale atteinte
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    // Charger la position
    const chess = ChessService.loadPosition(fen);

    // Obtenir tous les coups légaux
    const legalMoves = ChessService.getLegalMoves(chess, true) as Array<{
      san: string;
      from: string;
      to: string;
    }>;

    // Limiter le nombre de variantes si nécessaire pour éviter explosion combinatoire
    const movesToExplore = legalMoves.slice(0, maxVariationsPerLevel);

    // Générer les nœuds pour chaque coup
    return movesToExplore.map((move) => {
      // Créer une nouvelle instance pour chaque variante
      const newChess = ChessService.loadPosition(fen);
      // Utiliser le format SAN directement ou convertir l'objet move en Move typé
      const moveToPlay = {
        from: move.from as any,
        to: move.to as any,
      };
      ChessService.makeMove(newChess, moveToPlay);

      // Générer récursivement les enfants
      const children = generateVariationsRecursive(
        newChess.fen(),
        currentDepth + 1,
        maxDepth,
        [...currentPath, move.san],
        maxVariationsPerLevel
      );

      return {
        move: move.san,
        fen: newChess.fen(),
        depth: currentDepth + 1,
        children,
      };
    });
  } catch (error) {
    // En cas d'erreur (FEN invalide, position invalide), retourner tableau vide
    console.error(
      `Erreur lors de la génération de variantes pour FEN ${fen}:`,
      error
    );
    return [];
  }
}

/**
 * Obtient toutes les variantes sous forme de liste aplatie (toutes les séquences de coups)
 *
 * @param tree - Arbre de variantes
 * @returns Array de séquences de coups (chaque séquence est un chemin complet)
 *
 * @example
 * ```typescript
 * const tree = generateAllLegalVariations(fen, { maxDepth: 2 });
 * const sequences = getAllVariationSequences(tree);
 * // sequences = [["e4", "e5"], ["e4", "c5"], ["d4", "d5"], ...]
 * ```
 */
export function getAllVariationSequences(tree: VariationTree): string[][] {
  const sequences: string[][] = [];

  function traverse(node: VariationNode, path: string[] = []) {
    const newPath = [...path, node.move];

    if (node.children.length === 0) {
      // Feuille de l'arbre - ajouter la séquence complète
      sequences.push(newPath);
    } else {
      // Continuer la traversée pour chaque enfant
      node.children.forEach((child) => traverse(child, newPath));
    }
  }

  tree.nodes.forEach((node) => traverse(node, []));

  return sequences;
}

/**
 * Obtient le nombre total de variantes dans l'arbre
 *
 * @param tree - Arbre de variantes
 * @returns Nombre total de variantes (séquences complètes)
 */
export function getVariationCount(tree: VariationTree): number {
  return getAllVariationSequences(tree).length;
}

/**
 * Obtient le nombre total de nœuds dans l'arbre
 *
 * @param tree - Arbre de variantes
 * @returns Nombre total de nœuds
 */
export function getNodeCount(tree: VariationTree): number {
  function countNodes(nodes: VariationNode[]): number {
    let count = nodes.length;
    nodes.forEach((node) => {
      count += countNodes(node.children);
    });
    return count;
  }

  return countNodes(tree.nodes);
}
