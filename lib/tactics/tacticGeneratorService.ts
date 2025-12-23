/**
 * Service de génération automatique de problèmes tactiques
 * Utilise Stockfish pour analyser des positions et identifier des opportunités tactiques
 */

import { Chess } from "chess.js";
import {
  StockfishService,
  getStockfishService,
} from "@/lib/stockfish/stockfishService";
import type {
  AnalysisResult,
  TacticalDifficulty,
  TacticType,
} from "@/types/chess";
import { supabase } from "@/lib/supabase/client";

/**
 * Options pour la génération de tactiques
 */
export interface GenerationOptions {
  /** Nombre minimum de coups dans la solution */
  minMoves?: number;
  /** Nombre maximum de coups dans la solution */
  maxMoves?: number;
  /** Nombre exact de coups (prioritaire sur min/max) */
  exactMoves?: number;
  /** Profondeur d'analyse Stockfish (défaut: 20) */
  depth?: number;
}

/**
 * Candidat de tactique détecté lors de l'analyse
 */
export interface TacticCandidate {
  /** Position FEN initiale */
  position: string;
  /** Séquence de coups solution (format UCI) */
  solution: string[];
  /** Évaluation avant le coup tactique */
  beforeScore: number;
  /** Évaluation après le coup tactique */
  afterScore: number;
  /** Delta d'évaluation */
  scoreDelta: number;
  /** Résultat d'analyse Stockfish */
  analysis: AnalysisResult;
}

/**
 * Tactique générée complète avec toutes les métadonnées
 */
export interface GeneratedTactic {
  /** Position initiale en notation FEN */
  position_fen: string;
  /** Séquence de coups solution en notation SAN */
  solution_moves: string[];
  /** Niveau de difficulté estimé */
  difficulty: TacticalDifficulty;
  /** Type de tactique détecté */
  tactic_type: TacticType;
  /** Explication de la solution */
  explanation: string;
  /** Source du problème (toujours 'generated' pour ce service) */
  source: "generated";
}

/**
 * Partie d'échecs parsée depuis PGN
 */
export interface ParsedGame {
  /** Coups de la partie en notation SAN */
  moves: string[];
  /** Métadonnées de la partie (optionnel) */
  metadata?: Record<string, string>;
}

/**
 * Service de génération de problèmes tactiques
 */
export class TacticGeneratorService {
  private stockfishService: StockfishService;

  /**
   * Constructeur du service
   * @param stockfishService - Instance du service Stockfish (optionnel, utilise singleton par défaut)
   */
  constructor(stockfishService?: StockfishService) {
    this.stockfishService = stockfishService || getStockfishService();
  }

  /**
   * Analyse une position avec Stockfish
   * @param fen - Position FEN à analyser
   * @param options - Options d'analyse (profondeur, etc.)
   * @returns Résultat de l'analyse Stockfish
   */
  async analyzePosition(
    fen: string,
    options?: { depth?: number }
  ): Promise<AnalysisResult> {
    // S'assurer que le moteur est initialisé
    if (!this.stockfishService.isReady()) {
      await this.stockfishService.initialize();
    }

    const depth = options?.depth ?? 20;
    return await this.stockfishService.analyzePosition(fen, { depth });
  }

  /**
   * Détecte une opportunité tactique dans une position
   * @param fen - Position FEN à analyser
   * @param analysis - Résultat d'analyse Stockfish (optionnel, sera calculé si non fourni)
   * @param options - Options de génération (filtrage par nombre de coups)
   * @returns Candidat de tactique détecté ou null si aucune tactique trouvée
   */
  async detectTactic(
    fen: string,
    analysis?: AnalysisResult,
    options?: GenerationOptions
  ): Promise<TacticCandidate | null> {
    // Analyser la position si l'analyse n'est pas fournie
    if (!analysis) {
      analysis = await this.analyzePosition(fen, {
        depth: options?.depth ?? 20,
      });
    }

    // Vérifier qu'on a une ligne principale (PV)
    if (!analysis.pv || analysis.pv.length === 0) {
      return null;
    }

    // Calculer l'évaluation avant le coup tactique
    const beforeScore = analysis.evaluation ?? 0;

    // Simuler le premier coup pour obtenir l'évaluation après
    const chess = new Chess(fen);
    const firstMove = analysis.pv[0];

    try {
      chess.move({
        from: firstMove.slice(0, 2),
        to: firstMove.slice(2, 4),
      } as any);
      const afterFen = chess.fen();
      const afterAnalysis = await this.analyzePosition(afterFen, {
        depth: options?.depth ?? 20,
      });
      const afterScore = afterAnalysis.evaluation ?? 0;

      // Calculer le delta d'évaluation
      const scoreDelta = Math.abs(afterScore - beforeScore);

      // Vérifier qu'il y a un changement significatif (> 200 centipawns)
      if (scoreDelta < 200) {
        return null;
      }

      // Filtrer selon le nombre de coups demandé
      const solutionLength = analysis.pv.length;
      if (options?.exactMoves !== undefined) {
        if (solutionLength !== options.exactMoves) {
          return null;
        }
      } else {
        if (
          options?.minMoves !== undefined &&
          solutionLength < options.minMoves
        ) {
          return null;
        }
        if (
          options?.maxMoves !== undefined &&
          solutionLength > options.maxMoves
        ) {
          return null;
        }
      }

      return {
        position: fen,
        solution: analysis.pv,
        beforeScore,
        afterScore,
        scoreDelta,
        analysis,
      };
    } catch (error) {
      // Coup invalide, ignorer cette position
      console.warn(`Coup invalide dans la PV: ${firstMove}`, error);
      return null;
    }
  }

  /**
   * Génère une tactique complète à partir d'un candidat détecté
   * @param candidate - Candidat de tactique détecté
   * @returns Tactique générée avec métadonnées complètes
   */
  async generateTactic(candidate: TacticCandidate): Promise<GeneratedTactic> {
    // Classifier le type de tactique
    const tacticType = this.classifyTacticType(
      candidate.position,
      candidate.solution
    );

    // Estimer la difficulté
    const difficulty = this.estimateDifficulty(candidate.solution);

    // Générer l'explication
    const explanation = this.generateExplanation(
      tacticType,
      candidate.solution
    );

    // Convertir les coups UCI en notation SAN
    const solutionMoves = this.convertUciToSan(
      candidate.position,
      candidate.solution
    );

    return {
      position_fen: candidate.position,
      solution_moves: solutionMoves,
      difficulty,
      tactic_type: tacticType,
      explanation,
      source: "generated",
    };
  }

  /**
   * Génère des tactiques à partir d'une liste de parties
   * @param games - Liste de parties parsées
   * @param options - Options de génération (nombre de coups, profondeur, etc.)
   * @returns Liste de tactiques générées
   */
  async generateTacticsFromGames(
    games: ParsedGame[],
    options?: GenerationOptions & { count?: number }
  ): Promise<GeneratedTactic[]> {
    const tactics: GeneratedTactic[] = [];
    const maxCount = options?.count ?? 20;

    for (const game of games) {
      if (tactics.length >= maxCount) {
        break;
      }

      // Extraire les positions de la partie
      const positions = this.getPositionsFromGame(game.moves);

      for (const position of positions) {
        if (tactics.length >= maxCount) {
          break;
        }

        try {
          const candidate = await this.detectTactic(
            position.fen,
            undefined,
            options
          );
          if (candidate) {
            const tactic = await this.generateTactic(candidate);
            tactics.push(tactic);
          }
        } catch (error) {
          console.warn(`Erreur lors de la génération de tactique:`, error);
          // Continuer avec la position suivante
        }
      }
    }

    return tactics;
  }

  /**
   * Génère des tactiques depuis la position initiale en explorant des variantes
   * @param options - Options de génération
   * @param onProgress - Callback appelé à chaque progression (position analysée, tactique trouvée, nouvelles tactiques)
   * @returns Liste de tactiques générées
   */
  async generateTacticsFromStartPosition(
    options?: GenerationOptions & { count?: number; maxDepth?: number },
    onProgress?: (progress: {
      positionsAnalyzed: number;
      tacticsFound: number;
      currentPosition?: string;
      status: string;
      newTactics?: GeneratedTactic[];
    }) => void
  ): Promise<GeneratedTactic[]> {
    const tactics: GeneratedTactic[] = [];
    const maxCount = options?.count ?? 10;
    const maxDepth = options?.maxDepth ?? 15; // Profondeur maximale de recherche
    let positionsAnalyzed = 0;

    // Position initiale
    const startPosition =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    // Fonction récursive pour explorer les variantes
    const exploreVariations = async (
      chess: Chess,
      depth: number,
      path: string[]
    ): Promise<void> => {
      if (tactics.length >= maxCount || depth >= maxDepth) {
        return;
      }

      // Obtenir les coups légaux
      const legalMoves = chess.moves({ verbose: true });
      if (legalMoves.length === 0) {
        return;
      }

      // Limiter le nombre de variantes explorées à chaque niveau pour la performance
      const movesToExplore = legalMoves.slice(
        0,
        Math.min(5, legalMoves.length)
      );

      for (const move of movesToExplore) {
        if (tactics.length >= maxCount) {
          break;
        }

        try {
          // Jouer le coup
          const moveResult = chess.move(move);
          if (!moveResult) continue;

          const currentFen = chess.fen();
          positionsAnalyzed++;

          // Notifier la progression
          onProgress?.({
            positionsAnalyzed,
            tacticsFound: tactics.length,
            currentPosition: currentFen,
            status: `Analyse de la position (profondeur ${depth})...`,
          });

          // Analyser la position pour détecter une tactique
          const candidate = await this.detectTactic(
            currentFen,
            undefined,
            options
          );

          if (candidate) {
            const tactic = await this.generateTactic(candidate);
            tactics.push(tactic);

            onProgress?.({
              positionsAnalyzed,
              tacticsFound: tactics.length,
              currentPosition: currentFen,
              status: `Tactique trouvée ! (${tactic.tactic_type})`,
              newTactics: [tactic],
            });
          }

          // Continuer l'exploration si on n'a pas atteint la profondeur max
          if (depth < maxDepth - 1 && tactics.length < maxCount) {
            await exploreVariations(chess, depth + 1, [...path, move.san]);
          }

          // Annuler le coup pour explorer d'autres variantes
          chess.undo();
        } catch (error) {
          console.warn(`Erreur lors de l'exploration:`, error);
          // Essayer de restaurer l'état
          try {
            chess.undo();
          } catch {
            // Si undo échoue, créer une nouvelle instance
            chess = new Chess(startPosition);
            for (const moveSan of path) {
              chess.move(moveSan);
            }
          }
        }
      }
    };

    // Démarrer l'exploration depuis la position initiale
    const chess = new Chess(startPosition);
    onProgress?.({
      positionsAnalyzed: 0,
      tacticsFound: 0,
      currentPosition: startPosition,
      status: "Démarrage de la recherche depuis la position initiale...",
    });

    await exploreVariations(chess, 0, []);

    return tactics;
  }

  /**
   * Sauvegarde une tactique générée dans Supabase
   * @param tactic - Tactique à sauvegarder
   * @returns ID de la tactique sauvegardée
   * @throws Error si la sauvegarde échoue
   */
  async saveTactic(tactic: GeneratedTactic): Promise<string> {
    // Vérifier les duplications (même position FEN)
    const { data: existing } = await supabase
      .from("tactical_problems")
      .select("id")
      .eq("position_fen", tactic.position_fen)
      .single();

    if (existing) {
      throw new Error(
        `Une tactique avec cette position existe déjà (ID: ${existing.id})`
      );
    }

    // Insérer la nouvelle tactique
    const { data, error } = await supabase
      .from("tactical_problems")
      .insert({
        position_fen: tactic.position_fen,
        solution_moves: tactic.solution_moves,
        difficulty: tactic.difficulty,
        tactic_type: tactic.tactic_type,
        explanation: tactic.explanation,
        source: tactic.source,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Échec de sauvegarde de la tactique: ${error.message}`);
    }

    if (!data) {
      throw new Error("Aucune donnée retournée après insertion");
    }

    return data.id;
  }

  /**
   * Classifie le type de tactique détecté
   * @param fen - Position FEN
   * @param moves - Séquence de coups solution (format UCI)
   * @returns Type de tactique détecté
   */
  private classifyTacticType(fen: string, moves: string[]): TacticType {
    const chess = new Chess(fen);
    const sanMoves: string[] = [];

    // Convertir les coups UCI en SAN pour l'analyse
    try {
      for (const uciMove of moves) {
        const move = chess.move({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: uciMove.length > 4 ? (uciMove[4] as any) : undefined,
        } as any);
        if (move) {
          sanMoves.push(move.san);
        }
      }

      // Vérifier si la position finale est un mat
      if (chess.isCheckmate()) {
        return "Mat";
      }
    } catch (error) {
      // En cas d'erreur, retourner un type par défaut
      return "Gain de matériel";
    }

    // Détecter les mats dans la notation SAN (fallback)
    if (sanMoves.some((m) => m.includes("#"))) {
      return "Mat";
    }

    // Détecter les fourchettes (cavaliers attaquant deux pièces)
    if (sanMoves.some((m) => m.startsWith("N") && m.includes("x"))) {
      // Heuristique basique : si le premier coup est un cavalier avec capture
      if (sanMoves[0]?.startsWith("N")) {
        return "Fourchette";
      }
    }

    // Détecter les clouages (mouvements qui révèlent une attaque)
    // Heuristique basique : si plusieurs coups avec captures
    if (sanMoves.filter((m) => m.includes("x")).length >= 2) {
      return "Double attaque";
    }

    // Détecter le gain de matériel simple
    if (sanMoves.some((m) => m.includes("x")) && sanMoves.length <= 2) {
      return "Gain de matériel";
    }

    // Par défaut: Gain de matériel
    return "Gain de matériel";
  }

  /**
   * Estime la difficulté d'une tactique basée sur sa solution
   * @param solution - Séquence de coups solution
   * @returns Niveau de difficulté estimé
   */
  private estimateDifficulty(solution: string[]): TacticalDifficulty {
    const length = solution.length;

    if (length <= 2) {
      return "Facile";
    } else if (length <= 4) {
      return "Moyen";
    } else {
      return "Difficile";
    }
  }

  /**
   * Génère une explication textuelle pour une tactique
   * @param tacticType - Type de tactique
   * @param solution - Séquence de coups solution
   * @returns Explication textuelle
   */
  private generateExplanation(
    tacticType: TacticType,
    solution: string[]
  ): string {
    const templates: Record<TacticType, string> = {
      Fourchette:
        "Le cavalier attaque simultanément deux pièces, forçant un gain matériel.",
      Clouage:
        "Une pièce est clouée et ne peut bouger sans exposer une pièce plus importante.",
      Enfilade: "Une pièce attaque plusieurs pièces alignées.",
      Découverte: "Un coup révèle une attaque cachée d'une autre pièce.",
      Mat: `Une séquence de ${solution.length} coup(s) forcé(s) menant au mat.`,
      "Gain de matériel": "Une combinaison permettant de gagner du matériel.",
      "Double attaque": "Une attaque simultanée sur deux cibles différentes.",
      Sacrifice:
        "Un sacrifice de matériel pour obtenir un avantage positionnel ou matériel.",
    };

    return templates[tacticType] || "Combinaison tactique intéressante.";
  }

  /**
   * Convertit une séquence de coups UCI en notation SAN
   * @param fen - Position FEN initiale
   * @param uciMoves - Séquence de coups en format UCI
   * @returns Séquence de coups en notation SAN
   */
  private convertUciToSan(fen: string, uciMoves: string[]): string[] {
    const chess = new Chess(fen);
    const sanMoves: string[] = [];

    for (const uciMove of uciMoves) {
      try {
        const move = chess.move({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: uciMove.length > 4 ? (uciMove[4] as any) : undefined,
        } as any);

        if (move) {
          sanMoves.push(move.san);
        } else {
          // Si le coup ne peut pas être joué, essayer de continuer
          console.warn(`Impossible de convertir le coup UCI: ${uciMove}`);
        }
      } catch (error) {
        console.warn(
          `Erreur lors de la conversion du coup UCI: ${uciMove}`,
          error
        );
      }
    }

    return sanMoves;
  }

  /**
   * Parse un fichier PGN et extrait les parties
   * @param pgnContent - Contenu du fichier PGN (peut contenir plusieurs parties)
   * @returns Liste de parties parsées
   */
  parsePGN(pgnContent: string): ParsedGame[] {
    const games: ParsedGame[] = [];

    // Séparer les parties PGN en utilisant le pattern: ligne vide + [Event
    // Format PGN: chaque partie commence par [Event et se termine par un résultat
    const lines = pgnContent.split("\n");
    const gameBlocks: string[] = [];
    let currentBlock: string[] = [];
    let inGame = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Détecter le début d'une nouvelle partie (ligne avec [Event)
      if (trimmed.startsWith("[Event")) {
        // Si on avait un bloc en cours, le sauvegarder
        if (currentBlock.length > 0) {
          gameBlocks.push(currentBlock.join("\n"));
        }
        currentBlock = [line];
        inGame = true;
      } else if (inGame) {
        currentBlock.push(line);
        // Détecter la fin d'une partie (résultat suivi d'une ligne vide ou fin de fichier)
        if (/^(\d+-\d+|1\/2-1\/2|\*)/.test(trimmed)) {
          // Vérifier si la ligne suivante est vide ou si c'est la fin
          if (i === lines.length - 1 || lines[i + 1].trim() === "") {
            gameBlocks.push(currentBlock.join("\n"));
            currentBlock = [];
            inGame = false;
          }
        }
      }
    }

    // Ajouter le dernier bloc s'il existe
    if (currentBlock.length > 0) {
      gameBlocks.push(currentBlock.join("\n"));
    }

    for (const block of gameBlocks) {
      const trimmedBlock = block.trim();
      if (trimmedBlock.length === 0 || !trimmedBlock.includes("[")) {
        continue;
      }

      try {
        // Créer une nouvelle instance Chess pour chaque partie
        const chess = new Chess();
        chess.loadPgn(trimmedBlock);

        // loadPgn() retourne undefined, donc on vérifie directement les coups
        const moves = chess.history();
        if (moves && moves.length > 0) {
          games.push({
            moves,
            metadata: this.extractPGNMetadata(trimmedBlock),
          });
        }
      } catch (error) {
        // Ignorer les parties invalides
        console.warn(`Impossible de parser une partie PGN:`, error);
      }
    }

    return games;
  }

  /**
   * Extrait les métadonnées d'un bloc PGN
   * @param pgnBlock - Bloc PGN avec en-têtes
   * @returns Métadonnées extraites
   */
  private extractPGNMetadata(pgnBlock: string): Record<string, string> {
    const metadata: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
    let match;

    while ((match = headerRegex.exec(pgnBlock)) !== null) {
      metadata[match[1]] = match[2];
    }

    return metadata;
  }

  /**
   * Extrait les positions d'une partie pour analyse
   * @param moves - Coups de la partie en notation SAN
   * @returns Liste de positions FEN extraites
   */
  private getPositionsFromGame(
    moves: string[]
  ): Array<{ fen: string; moveNumber: number }> {
    const chess = new Chess();
    const positions: Array<{ fen: string; moveNumber: number }> = [];

    // Ajouter la position initiale
    positions.push({ fen: chess.fen(), moveNumber: 0 });

    // Jouer chaque coup et extraire la position
    for (let i = 0; i < moves.length; i++) {
      try {
        const move = chess.move(moves[i]);
        if (move) {
          positions.push({ fen: chess.fen(), moveNumber: i + 1 });
        }
      } catch (error) {
        // Ignorer les coups invalides
        console.warn(`Coup invalide à l'index ${i}: ${moves[i]}`, error);
      }
    }

    return positions;
  }
}
