/**
 * Service de gestion des ouvertures personnalisées
 * Fournit des fonctions pour créer, récupérer, mettre à jour et supprimer des ouvertures personnalisées
 */

import { supabase } from "@/lib/supabase/client";
import { ChessService } from "@/lib/chess/chessService";
import type { Opening, OpeningVariation } from "@/types/chess";

/**
 * Erreur personnalisée pour les ouvertures personnalisées
 */
export class CustomOpeningError extends Error {
  constructor(
    message: string,
    public code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND"
  ) {
    super(message);
    this.name = "CustomOpeningError";
  }
}

/**
 * Données d'entrée pour créer une ouverture personnalisée
 */
export interface CustomOpeningInput {
  /** Nom de l'ouverture (requis) */
  name: string;
  /** Code ECO (optionnel) */
  eco_code?: string;
  /** Séquence de coups en notation algébrique */
  moves: string[];
  /** Variantes optionnelles */
  variations?: OpeningVariation[];
  /** Description optionnelle */
  description?: string;
  /** Côté du joueur (blancs ou noirs) */
  player_side: "white" | "black";
}

/**
 * Résultat de validation
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valide les données d'une ouverture personnalisée
 * @param input - Données à valider
 * @returns Résultat de validation
 */
function validateOpeningData(input: CustomOpeningInput): ValidationResult {
  // Vérifier nom non vide
  if (!input.name || input.name.trim().length === 0) {
    return {
      isValid: false,
      error: "Le nom de l'ouverture est requis",
    };
  }

  // Vérifier au moins 2 coups
  if (!input.moves || input.moves.length < 2) {
    return {
      isValid: false,
      error: "L'ouverture doit contenir au moins 2 coups",
    };
  }

  // Valider séquence de coups avec ChessService
  try {
    const game = ChessService.createGame();
    for (const move of input.moves) {
      const validation = ChessService.validateMove(game, move);
      if (!validation.isValid) {
        return {
          isValid: false,
          error: `Coup invalide dans la séquence: ${move}. ${validation.error}`,
        };
      }
      ChessService.makeMove(game, move);
    }
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la validation des coups",
    };
  }

  // Valider format ECO si fourni
  if (input.eco_code && input.eco_code.trim().length > 0) {
    const ecoPattern = /^[A-E][0-9]{2}$/;
    if (!ecoPattern.test(input.eco_code.trim())) {
      return {
        isValid: false,
        error: "Le code ECO doit être au format A00-E99",
      };
    }
  }

  return { isValid: true };
}

/**
 * Crée une nouvelle ouverture personnalisée
 * @param opening - Données de l'ouverture à créer
 * @returns Promise<Opening> - L'ouverture créée
 * @throws {CustomOpeningError} Si la validation ou la sauvegarde échoue
 */
export async function createCustomOpening(
  opening: CustomOpeningInput
): Promise<Opening> {
  // Valider les données
  const validation = validateOpeningData(opening);
  if (!validation.isValid) {
    throw new CustomOpeningError(
      validation.error || "Données invalides",
      "VALIDATION_ERROR"
    );
  }

  try {
    // Générer un code ECO unique si non fourni (format: C + timestamp tronqué)
    // Le code ECO doit faire max 10 caractères, donc on utilise un hash court
    const generateEcoCode = (): string => {
      const timestamp = Date.now().toString(36).slice(-6).toUpperCase(); // 6 caractères max
      return `C${timestamp}`; // Format: C + 6 caractères = 7 caractères max
    };

    // Préparer les données pour Supabase
    const openingData = {
      name: opening.name.trim(),
      eco_code: opening.eco_code?.trim() || generateEcoCode(),
      moves: opening.moves,
      variations: opening.variations || [],
      description: opening.description?.trim() || null,
      player_side: opening.player_side,
      is_custom: true,
      created_by: null, // Pour futur système d'authentification
    };

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from("openings")
      .insert(openingData)
      .select()
      .single();

    if (error) {
      // Gérer les erreurs de contrainte (ex: code ECO déjà existant)
      if (error.code === "23505") {
        // Violation de contrainte unique
        throw new CustomOpeningError(
          "Un code ECO similaire existe déjà. Veuillez en choisir un autre.",
          "VALIDATION_ERROR"
        );
      }
      throw new CustomOpeningError(
        `Erreur lors de la sauvegarde: ${error.message}`,
        "DATABASE_ERROR"
      );
    }

    if (!data) {
      throw new CustomOpeningError(
        "Aucune donnée retournée après insertion",
        "DATABASE_ERROR"
      );
    }

    return data as Opening;
  } catch (error) {
    if (error instanceof CustomOpeningError) {
      throw error;
    }
    throw new CustomOpeningError(
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue",
      "DATABASE_ERROR"
    );
  }
}

/**
 * Récupère toutes les ouvertures personnalisées
 * @returns Promise<Opening[]> - Liste des ouvertures personnalisées
 * @throws {CustomOpeningError} Si la récupération échoue
 */
export async function getCustomOpenings(): Promise<Opening[]> {
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("*")
      .eq("is_custom", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new CustomOpeningError(
        `Échec de récupération des ouvertures: ${error.message}`,
        "DATABASE_ERROR"
      );
    }

    return (data || []) as Opening[];
  } catch (error) {
    if (error instanceof CustomOpeningError) {
      throw error;
    }
    throw new CustomOpeningError(
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue",
      "DATABASE_ERROR"
    );
  }
}

/**
 * Met à jour une ouverture personnalisée existante
 * @param id - ID de l'ouverture à mettre à jour
 * @param updates - Données à mettre à jour
 * @returns Promise<Opening> - L'ouverture mise à jour
 * @throws {CustomOpeningError} Si la mise à jour échoue
 */
export async function updateCustomOpening(
  id: string,
  updates: Partial<CustomOpeningInput>
): Promise<Opening> {
  try {
    // Vérifier que l'ouverture existe et est personnalisée
    const { data: existing, error: fetchError } = await supabase
      .from("openings")
      .select("*")
      .eq("id", id)
      .eq("is_custom", true)
      .single();

    if (fetchError || !existing) {
      throw new CustomOpeningError(
        "Ouverture personnalisée introuvable",
        "NOT_FOUND"
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.eco_code !== undefined) {
      updateData.eco_code = updates.eco_code.trim() || null;
    }
    if (updates.moves !== undefined) {
      updateData.moves = updates.moves;
    }
    if (updates.variations !== undefined) {
      updateData.variations = updates.variations;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim() || null;
    }
    if (updates.player_side !== undefined) {
      updateData.player_side = updates.player_side;
    }

    // Valider si des coups sont fournis
    if (updates.moves) {
      const validation = validateOpeningData({
        name: updateData.name || existing.name,
        eco_code: updateData.eco_code || existing.eco_code,
        moves: updates.moves,
        variations: updates.variations,
        description: updates.description,
        player_side: updates.player_side || existing.player_side,
      });

      if (!validation.isValid) {
        throw new CustomOpeningError(
          validation.error || "Données invalides",
          "VALIDATION_ERROR"
        );
      }
    }

    // Mettre à jour dans Supabase
    const { data, error } = await supabase
      .from("openings")
      .update(updateData)
      .eq("id", id)
      .eq("is_custom", true)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new CustomOpeningError(
          "Un code ECO similaire existe déjà",
          "VALIDATION_ERROR"
        );
      }
      throw new CustomOpeningError(
        `Erreur lors de la mise à jour: ${error.message}`,
        "DATABASE_ERROR"
      );
    }

    if (!data) {
      throw new CustomOpeningError(
        "Aucune donnée retournée après mise à jour",
        "DATABASE_ERROR"
      );
    }

    return data as Opening;
  } catch (error) {
    if (error instanceof CustomOpeningError) {
      throw error;
    }
    throw new CustomOpeningError(
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue",
      "DATABASE_ERROR"
    );
  }
}

/**
 * Supprime une ouverture personnalisée
 * @param id - ID de l'ouverture à supprimer
 * @returns Promise<void>
 * @throws {CustomOpeningError} Si la suppression échoue
 */
export async function deleteCustomOpening(id: string): Promise<void> {
  try {
    // Vérifier que l'ouverture existe et est personnalisée
    const { data: existing, error: fetchError } = await supabase
      .from("openings")
      .select("id")
      .eq("id", id)
      .eq("is_custom", true)
      .single();

    if (fetchError || !existing) {
      throw new CustomOpeningError(
        "Ouverture personnalisée introuvable",
        "NOT_FOUND"
      );
    }

    // Supprimer de Supabase
    const { error } = await supabase
      .from("openings")
      .delete()
      .eq("id", id)
      .eq("is_custom", true);

    if (error) {
      throw new CustomOpeningError(
        `Erreur lors de la suppression: ${error.message}`,
        "DATABASE_ERROR"
      );
    }
  } catch (error) {
    if (error instanceof CustomOpeningError) {
      throw error;
    }
    throw new CustomOpeningError(
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue",
      "DATABASE_ERROR"
    );
  }
}

