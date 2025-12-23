/**
 * Service pour la gestion des problèmes tactiques
 * Gère la récupération et le filtrage des problèmes depuis Supabase
 */

import { supabase } from "@/lib/supabase/client";
import type { TacticalProblem, TacticalDifficulty, TacticType } from "@/types/chess";

/**
 * Récupère tous les problèmes tactiques
 * @returns Array de tous les problèmes tactiques
 * @throws Error si la récupération échoue
 */
export async function getTacticalProblems(): Promise<TacticalProblem[]> {
  const { data, error } = await supabase
    .from("tactical_problems")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Échec de récupération des problèmes tactiques: ${error.message}`);
  }

  return data as TacticalProblem[];
}

/**
 * Récupère les problèmes tactiques avec filtres optionnels
 * @param difficulty - Filtre par niveau de difficulté (optionnel)
 * @param tacticType - Filtre par type de tactique (optionnel)
 * @returns Array de problèmes tactiques filtrés
 * @throws Error si la récupération échoue
 */
export async function getTacticalProblemsByFilter(
  difficulty?: TacticalDifficulty,
  tacticType?: TacticType
): Promise<TacticalProblem[]> {
  let query = supabase
    .from("tactical_problems")
    .select("*");

  // Appliquer le filtre de difficulté si fourni
  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  // Appliquer le filtre de type de tactique si fourni
  if (tacticType) {
    query = query.eq("tactic_type", tacticType);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Échec de récupération des problèmes tactiques: ${error.message}`);
  }

  return data as TacticalProblem[];
}

/**
 * Récupère un problème tactique par son ID
 * @param id - UUID du problème tactique
 * @returns Problème tactique correspondant
 * @throws Error si la récupération échoue ou si le problème n'existe pas
 */
export async function getTacticalProblemById(
  id: string
): Promise<TacticalProblem> {
  const { data, error } = await supabase
    .from("tactical_problems")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Échec de récupération du problème tactique: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Problème tactique avec l'ID ${id} introuvable`);
  }

  return data as TacticalProblem;
}

/**
 * Récupère le nombre total de problèmes par difficulté
 * @returns Objet avec le nombre de problèmes par niveau
 */
export async function getProblemCountsByDifficulty(): Promise<Record<TacticalDifficulty, number>> {
  const { data, error } = await supabase
    .from("tactical_problems")
    .select("difficulty");

  if (error) {
    throw new Error(`Échec de récupération des statistiques: ${error.message}`);
  }

  const counts: Record<string, number> = {
    "Facile": 0,
    "Moyen": 0,
    "Difficile": 0,
  };

  data?.forEach((problem: { difficulty: string }) => {
    counts[problem.difficulty] = (counts[problem.difficulty] || 0) + 1;
  });

  return counts as Record<TacticalDifficulty, number>;
}

/**
 * Récupère tous les types de tactiques disponibles
 * @returns Array de types de tactiques uniques
 */
export async function getAvailableTacticTypes(): Promise<TacticType[]> {
  const { data, error } = await supabase
    .from("tactical_problems")
    .select("tactic_type");

  if (error) {
    throw new Error(`Échec de récupération des types de tactiques: ${error.message}`);
  }

  // Extraire les types uniques
  const uniqueTypes = new Set<TacticType>();
  data?.forEach((problem: { tactic_type: TacticType }) => {
    uniqueTypes.add(problem.tactic_type);
  });

  return Array.from(uniqueTypes).sort();
}

