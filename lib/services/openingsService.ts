/**
 * Service de gestion des ouvertures d'échecs
 * Fournit des fonctions pour récupérer les ouvertures depuis Supabase
 */

import { supabase } from "@/lib/supabase/client";
import type { Opening } from "@/types/chess";

/**
 * Récupère toutes les ouvertures depuis Supabase
 * @returns Promise<Opening[]> - Liste des ouvertures triées par nom
 * @throws Error si la récupération échoue
 */
export async function getOpenings(): Promise<Opening[]> {
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("*")
      .order("name");

    if (error) {
      throw new Error(`Échec de récupération des ouvertures: ${error.message}`);
    }

    return data as Opening[];
  } catch (error) {
    console.error("Error fetching openings:", error);
    throw error instanceof Error
      ? error
      : new Error(
          "Une erreur inconnue est survenue lors de la récupération des ouvertures"
        );
  }
}

/**
 * Récupère une ouverture spécifique par son ID
 * @param id - UUID de l'ouverture
 * @returns Promise<Opening> - L'ouverture demandée
 * @throws Error si la récupération échoue ou si l'ouverture n'existe pas
 */
export async function getOpeningById(id: string): Promise<Opening> {
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Échec de récupération de l'ouverture: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Ouverture introuvable avec l'ID: ${id}`);
    }

    // Validation: s'assurer que player_side existe (fallback temporaire pour compatibilité)
    if (!data.player_side) {
      console.warn(
        `⚠️  Ouverture ${id} sans player_side, utilisation de 'white' par défaut`
      );
      data.player_side = "white";
    }

    return data as Opening;
  } catch (error) {
    console.error(`Error fetching opening ${id}:`, error);
    throw error instanceof Error
      ? error
      : new Error(
          "Une erreur inconnue est survenue lors de la récupération de l'ouverture"
        );
  }
}

/**
 * Récupère les ouvertures filtrées par code ECO
 * @param ecoCode - Code ECO à rechercher (ex: "C70")
 * @returns Promise<Opening[]> - Liste des ouvertures correspondantes
 * @throws Error si la récupération échoue
 */
export async function getOpeningsByEcoCode(
  ecoCode: string
): Promise<Opening[]> {
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("*")
      .eq("eco_code", ecoCode)
      .order("name");

    if (error) {
      throw new Error(`Échec de récupération des ouvertures: ${error.message}`);
    }

    return data as Opening[];
  } catch (error) {
    console.error(`Error fetching openings by ECO code ${ecoCode}:`, error);
    throw error instanceof Error
      ? error
      : new Error(
          "Une erreur inconnue est survenue lors de la récupération des ouvertures"
        );
  }
}

/**
 * Récupère les ouvertures filtrées par côté du joueur (blancs ou noirs)
 * @param playerSide - Le côté du joueur ('white' ou 'black')
 * @returns Promise<Opening[]> - Liste des ouvertures correspondantes
 * @throws Error si la récupération échoue
 */
export async function getOpeningsByPlayerSide(
  playerSide: "white" | "black"
): Promise<Opening[]> {
  try {
    const { data, error } = await supabase
      .from("openings")
      .select("*")
      .eq("player_side", playerSide)
      .order("name");

    if (error) {
      throw new Error(`Échec de récupération des ouvertures: ${error.message}`);
    }

    return data as Opening[];
  } catch (error) {
    console.error(
      `Error fetching openings by player side ${playerSide}:`,
      error
    );
    throw error instanceof Error
      ? error
      : new Error(
          "Une erreur inconnue est survenue lors de la récupération des ouvertures"
        );
  }
}
