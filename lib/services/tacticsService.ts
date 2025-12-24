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
 * Options de filtre pour les problèmes tactiques
 */
export interface FilterOptions {
  difficulty?: TacticalDifficulty;
  tacticType?: TacticType;
  source?: "manual" | "generated" | "imported";
}

/**
 * Récupère les problèmes tactiques avec filtres optionnels
 * @param difficulty - Filtre par niveau de difficulté (optionnel) ou options complètes
 * @param tacticType - Filtre par type de tactique (optionnel)
 * @returns Array de problèmes tactiques filtrés
 * @throws Error si la récupération échoue
 */
export async function getTacticalProblemsByFilter(
  difficulty?: TacticalDifficulty | FilterOptions,
  tacticType?: TacticType
): Promise<TacticalProblem[]> {
  let query = supabase
    .from("tactical_problems")
    .select("*");

  // Gérer la compatibilité avec l'ancienne signature (difficulty, tacticType) ou nouvelle (FilterOptions)
  let options: FilterOptions;
  if (difficulty && typeof difficulty === "object" && !("length" in difficulty) && ("source" in difficulty || "difficulty" in difficulty || "tacticType" in difficulty)) {
    // Nouvelle signature avec FilterOptions
    options = difficulty;
  } else {
    // Ancienne signature avec paramètres séparés
    options = {
      difficulty: difficulty as TacticalDifficulty | undefined,
      tacticType: tacticType,
    };
  }

  // Appliquer le filtre de difficulté si fourni
  if (options.difficulty) {
    query = query.eq("difficulty", options.difficulty);
  }

  // Appliquer le filtre de type de tactique si fourni
  if (options.tacticType) {
    query = query.eq("tactic_type", options.tacticType);
  }

  // Appliquer le filtre de source si fourni
  if (options.source) {
    query = query.eq("source", options.source);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Échec de récupération des problèmes tactiques: ${error.message}`);
  }

  return data as TacticalProblem[];
}

/**
 * Récupère les puzzles tactiques Lichess (importés)
 * @param difficulty - Filtre par niveau de difficulté (optionnel)
 * @param tacticType - Filtre par type de tactique (optionnel)
 * @returns Array de problèmes tactiques Lichess filtrés
 * @throws Error si la récupération échoue
 */
export async function getLichessTacticalProblems(
  difficulty?: TacticalDifficulty,
  tacticType?: TacticType
): Promise<TacticalProblem[]> {
  return getTacticalProblemsByFilter({
    difficulty,
    tacticType,
    source: "imported",
  });
}

/**
 * Options de pagination
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Récupère les puzzles tactiques Lichess avec pagination
 * @param options - Options de filtrage et pagination
 * @returns Résultat paginé des problèmes tactiques Lichess
 * @throws Error si la récupération échoue
 */
export async function getLichessTacticalProblemsPaginated(
  options: {
    difficulty?: TacticalDifficulty;
    tacticType?: TacticType;
    pagination: PaginationOptions;
  }
): Promise<PaginatedResult<TacticalProblem>> {
  const { difficulty, tacticType, pagination } = options;
  const { page, pageSize } = pagination;
  
  let query = supabase
    .from("tactical_problems")
    .select("*", { count: "exact" })
    .eq("source", "imported");

  // Appliquer les filtres
  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  if (tacticType) {
    query = query.eq("tactic_type", tacticType);
  }

  // Calculer l'offset
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Appliquer la pagination et le tri
  const { data, error, count } = await query
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Échec de récupération des problèmes tactiques: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: (data as TacticalProblem[]) || [],
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Compte le nombre total de puzzles Lichess avec filtres
 * @param difficulty - Filtre par niveau de difficulté (optionnel)
 * @param tacticType - Filtre par type de tactique (optionnel)
 * @returns Nombre total de puzzles correspondants
 */
export async function countLichessTacticalProblems(
  difficulty?: TacticalDifficulty,
  tacticType?: TacticType
): Promise<number> {
  let query = supabase
    .from("tactical_problems")
    .select("*", { count: "exact", head: true })
    .eq("source", "imported");

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  if (tacticType) {
    query = query.eq("tactic_type", tacticType);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Échec du comptage des problèmes tactiques: ${error.message}`);
  }

  return count || 0;
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

