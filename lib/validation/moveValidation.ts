/**
 * Logique de validation des coups contre une ouverture d'échecs
 */

import type { OpeningVariation } from "@/types/chess";

export interface MoveValidationResult {
  /** Indique si le coup est valide selon l'ouverture */
  valid: boolean;
  /** Message de feedback pour l'utilisateur */
  message: string;
  /** Indique si la ligne d'ouverture est complétée */
  completed: boolean;
  /** Coup attendu si le coup est incorrect */
  expectedMove?: string;
}

/**
 * Valide un coup joué par l'utilisateur contre une variante d'ouverture
 * @param moveSan - Coup en notation algébrique standard (ex: "e4")
 * @param currentVariation - Variante d'ouverture actuelle
 * @param moveIndex - Index du coup dans la variante (0-based)
 * @returns Résultat de la validation avec feedback
 */
export function validateMoveAgainstOpening(
  moveSan: string,
  currentVariation: OpeningVariation,
  moveIndex: number
): MoveValidationResult {
  // Vérifier si on a dépassé la fin de la variante
  if (moveIndex >= currentVariation.moves.length) {
    return {
      valid: false,
      message: "La ligne d'ouverture est déjà complétée",
      completed: true,
    };
  }

  const expectedMove = currentVariation.moves[moveIndex];
  const isCorrect = moveSan === expectedMove;
  const isLastMove = moveIndex === currentVariation.moves.length - 1;

  if (isCorrect) {
    if (isLastMove) {
      return {
        valid: true,
        message: "🎉 Félicitations ! Vous avez complété la ligne d'ouverture !",
        completed: true,
      };
    }
    return {
      valid: true,
      message: "✓ Coup correct !",
      completed: false,
    };
  }

  return {
    valid: false,
    message: `✗ Coup incorrect. Le coup attendu était: ${expectedMove}`,
    completed: false,
    expectedMove,
  };
}

/**
 * Trouve toutes les variantes valides pour un coup donné
 * Utile pour gérer les cas où plusieurs variantes sont possibles
 * @param moveSan - Coup en notation algébrique standard
 * @param variations - Liste de toutes les variantes de l'ouverture
 * @param moveIndex - Index du coup dans la variante
 * @returns Liste des variantes qui acceptent ce coup à cet index
 */
export function findValidVariations(
  moveSan: string,
  variations: OpeningVariation[],
  moveIndex: number
): OpeningVariation[] {
  return variations.filter((variation) => {
    if (moveIndex >= variation.moves.length) {
      return false;
    }
    return variation.moves[moveIndex] === moveSan;
  });
}

/**
 * Calcule le score de progression dans une variante
 * @param currentMoveIndex - Index du coup actuel
 * @param totalMoves - Nombre total de coups dans la variante
 * @returns Pourcentage de progression (0-100)
 */
export function calculateProgress(
  currentMoveIndex: number,
  totalMoves: number
): number {
  if (totalMoves === 0) return 0;
  return Math.round((currentMoveIndex / totalMoves) * 100);
}

