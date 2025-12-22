/**
 * Service d'intégration Stockfish.js
 * Gère l'initialisation, la communication UCI et l'analyse de positions
 */

import type {
  StockfishEngine,
  DifficultyLevel,
  StockfishConfig,
  AnalysisOptions,
  AnalysisResult,
} from "@/types/chess";

/**
 * Configuration des niveaux de difficulté
 */
const DIFFICULTY_CONFIGS: Record<DifficultyLevel, StockfishConfig> = {
  beginner: {
    skillLevel: 1,
    depth: 1,
    moveTime: 100,
  },
  intermediate: {
    skillLevel: 5,
    depth: 5,
    moveTime: 500,
  },
  advanced: {
    skillLevel: 10,
    depth: 10,
    moveTime: 1000,
  },
  expert: {
    skillLevel: 15,
    depth: 15,
    moveTime: 2000,
  },
  master: {
    skillLevel: 20,
    depth: 20,
    moveTime: 3000,
  },
};

/**
 * Service pour interagir avec le moteur Stockfish
 */
export class StockfishService {
  private engine: StockfishEngine | null = null;
  private isEngineReady: boolean = false;
  private currentDifficulty: DifficultyLevel = "intermediate";
  private messageQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  /**
   * Initialise le moteur Stockfish avec chargement dynamique
   */
  async initialize(): Promise<void> {
    if (this.engine) {
      return; // Déjà initialisé
    }

    try {
      // Vérifier le support WebAssembly
      if (typeof WebAssembly === "undefined") {
        throw new Error(
          "WebAssembly n'est pas supporté par ce navigateur. Stockfish nécessite WebAssembly."
        );
      }

      console.log("[Stockfish] Chargement du moteur...");

      // Chargement dynamique de Stockfish (lazy loading)
      const { loadStockfish } = await import("./stockfishLoader");
      this.engine = await loadStockfish();

      console.log("[Stockfish] Envoi de la commande 'uci'...");
      
      // Attendre l'initialisation
      const uciResponse = await this.sendCommand("uci", "uciok");
      console.log("[Stockfish] Réponse uci:", uciResponse);

      console.log("[Stockfish] Configuration de la difficulté...");
      // Configurer le niveau de difficulté par défaut
      await this.applyDifficultyConfig();

      console.log("[Stockfish] Vérification de l'état prêt...");
      // Vérifier que le moteur est prêt
      const readyResponse = await this.sendCommand("isready", "readyok");
      console.log("[Stockfish] Réponse readyok:", readyResponse);

      this.isEngineReady = true;
      console.log("[Stockfish] ✅ Moteur initialisé et prêt !");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[Stockfish] ❌ Erreur d'initialisation:", error);
      throw new Error(
        `Échec de l'initialisation de Stockfish: ${message}`
      );
    }
  }

  /**
   * Vérifie si le moteur est prêt
   */
  isReady(): boolean {
    return this.isEngineReady;
  }

  /**
   * Définit le niveau de difficulté
   */
  async setDifficulty(level: DifficultyLevel): Promise<void> {
    if (!this.engine) {
      throw new Error("Le moteur n'est pas initialisé");
    }

    this.currentDifficulty = level;
    await this.applyDifficultyConfig();
  }

  /**
   * Obtient le meilleur coup pour une position FEN
   */
  async getBestMove(
    fen: string,
    options?: AnalysisOptions
  ): Promise<string> {
    if (!this.engine || !this.isEngineReady) {
      throw new Error("Le moteur n'est pas initialisé ou prêt");
    }

    try {
      console.log(`[Stockfish] getBestMove pour FEN: ${fen}`);
      
      // Définir la position (position ne retourne pas de réponse non plus)
      this.engine.postMessage(`position fen ${fen}`);
      console.log(`[Stockfish] → Envoi direct: position fen ${fen}`);

      // Construire la commande go
      const config = DIFFICULTY_CONFIGS[this.currentDifficulty];
      const depth = options?.depth ?? config.depth;
      const moveTime = options?.moveTime ?? config.moveTime;

      let goCommand = "go";
      if (moveTime) {
        goCommand += ` movetime ${moveTime}`;
      } else {
        goCommand += ` depth ${depth}`;
      }

      console.log(`[Stockfish] Commande go: ${goCommand}`);

      // Lancer l'analyse
      const response = await this.sendCommand(goCommand, "bestmove");

      console.log(`[Stockfish] Réponse complète de go:`, response);

      // Extraire le meilleur coup de la réponse
      const match = response.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
      if (!match) {
        console.error(`[Stockfish] ❌ Impossible de parser bestmove dans:`, response);
        throw new Error("Impossible d'extraire le meilleur coup");
      }

      console.log(`[Stockfish] ✅ Meilleur coup trouvé: ${match[1]}`);
      return match[1];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[Stockfish] ❌ Erreur getBestMove:`, error);
      throw new Error(`Erreur lors de l'obtention du meilleur coup: ${message}`);
    }
  }

  /**
   * Analyse une position FEN et retourne des informations détaillées
   */
  async analyzePosition(
    fen: string,
    options?: AnalysisOptions
  ): Promise<AnalysisResult> {
    if (!this.engine || !this.isEngineReady) {
      throw new Error("Le moteur n'est pas initialisé ou prêt");
    }

    try {
      const startTime = Date.now();

      // Définir la position (position ne retourne pas de réponse non plus)
      this.engine.postMessage(`position fen ${fen}`);
      console.log(`[Stockfish] → Envoi direct: position fen ${fen}`);

      // Configurer l'analyse
      const config = DIFFICULTY_CONFIGS[this.currentDifficulty];
      const depth = options?.depth ?? config.depth;
      const moveTime = options?.moveTime ?? config.moveTime;
      const multiPv = options?.multiPv ?? 1;

      // Activer multi-PV si demandé (setoption sans réponse)
      if (multiPv > 1) {
        this.engine.postMessage(`setoption name MultiPV value ${multiPv}`);
        console.log(`[Stockfish] → Envoi direct: setoption name MultiPV value ${multiPv}`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Lancer l'analyse
      let goCommand = "go";
      if (moveTime) {
        goCommand += ` movetime ${moveTime}`;
      } else {
        goCommand += ` depth ${depth}`;
      }

      const response = await this.sendCommand(goCommand, "bestmove");

      // Parser la réponse
      const result = this.parseAnalysisResponse(response, startTime);

      // Réinitialiser MultiPV (setoption sans réponse)
      if (multiPv > 1) {
        this.engine.postMessage("setoption name MultiPV value 1");
        console.log(`[Stockfish] → Envoi direct: setoption name MultiPV value 1`);
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      throw new Error(`Erreur lors de l'analyse de position: ${message}`);
    }
  }

  /**
   * Termine le moteur et libère les ressources
   */
  terminate(): void {
    if (this.engine) {
      this.engine.terminate();
      this.engine = null;
      this.isEngineReady = false;
      this.messageQueue = [];
    }
  }

  /**
   * Applique la configuration de difficulté au moteur
   * Note: setoption ne retourne pas de réponse, on envoie sans attendre
   */
  private async applyDifficultyConfig(): Promise<void> {
    if (!this.engine) return;

    const config = DIFFICULTY_CONFIGS[this.currentDifficulty];

    // setoption ne retourne pas de réponse, on envoie directement
    this.engine.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
    console.log(`[Stockfish] → Envoi direct: setoption name Skill Level value ${config.skillLevel}`);

    // Limiter la force si niveau débutant/intermédiaire
    if (config.skillLevel < 10) {
      this.engine.postMessage("setoption name UCI_LimitStrength value true");
      console.log(`[Stockfish] → Envoi direct: setoption name UCI_LimitStrength value true`);
      
      const elo = 800 + config.skillLevel * 100; // 800-1800 ELO
      this.engine.postMessage(`setoption name UCI_Elo value ${elo}`);
      console.log(`[Stockfish] → Envoi direct: setoption name UCI_Elo value ${elo}`);
    } else {
      this.engine.postMessage("setoption name UCI_LimitStrength value false");
      console.log(`[Stockfish] → Envoi direct: setoption name UCI_LimitStrength value false`);
    }
    
    // Petite pause pour laisser le moteur traiter les options
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Envoie une commande UCI et attend une réponse spécifique
   */
  private sendCommand(
    command: string,
    expectedResponse?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.engine) {
        reject(new Error("Le moteur n'est pas initialisé"));
        return;
      }

      const timeout = setTimeout(() => {
        if (this.engine) {
          this.engine.onmessage = null;
        }
        reject(
          new Error(
            `Timeout: le moteur n'a pas répondu à la commande "${command}"`
          )
        );
      }, 30000);

      let fullResponse = "";

      this.engine.onmessage = (event: MessageEvent) => {
        // Extraire correctement la donnée du message
        let line: string;
        
        if (typeof event === "string") {
          line = event;
        } else if (event && typeof event.data === "string") {
          line = event.data;
        } else {
          console.warn("[Stockfish] Message ignoré (format inconnu):", event);
          return;
        }

        // Supprimer le \n final si présent
        if (line.endsWith("\n")) {
          line = line.slice(0, -1);
        }

        console.log(`[Stockfish] ← Reçu:`, line);

        // Si le message contient plusieurs lignes, les traiter séparément
        if (line.includes("\n")) {
          const lines = line.split("\n");
          for (const l of lines) {
            const trimmed = l.trim();
            if (trimmed) {
              fullResponse += trimmed + "\n";
              
              // Vérifier si c'est la réponse attendue
              if (expectedResponse && trimmed.includes(expectedResponse)) {
                console.log(`[Stockfish] ✅ Trouvé "${expectedResponse}"`);
                clearTimeout(timeout);
                this.engine!.onmessage = null;
                resolve(fullResponse);
                return;
              }
            }
          }
        } else {
          const trimmed = line.trim();
          if (trimmed) {
            fullResponse += trimmed + "\n";
            
            // Vérifier si c'est la réponse attendue
            if (expectedResponse && trimmed.includes(expectedResponse)) {
              console.log(`[Stockfish] ✅ Trouvé "${expectedResponse}"`);
              clearTimeout(timeout);
              this.engine!.onmessage = null;
              resolve(fullResponse);
            } else if (!expectedResponse) {
              clearTimeout(timeout);
              this.engine!.onmessage = null;
              resolve(fullResponse);
            }
          }
        }
      };

      // Envoyer la commande
      console.log(`[Stockfish] → Envoi: ${command}`);
      this.engine.postMessage(command);
    });
  }

  /**
   * Parse la réponse d'analyse pour extraire les informations
   */
  private parseAnalysisResponse(
    response: string,
    startTime: number
  ): AnalysisResult {
    const lines = response.split("\n");

    let bestMove = "";
    let evaluation: number | undefined;
    let depth = 0;
    let pv: string[] = [];

    for (const line of lines) {
      // Extraire le meilleur coup
      const bestMoveMatch = line.match(
        /bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/
      );
      if (bestMoveMatch) {
        bestMove = bestMoveMatch[1];
      }

      // Extraire les informations d'analyse
      if (line.startsWith("info")) {
        // Profondeur
        const depthMatch = line.match(/depth\s+(\d+)/);
        if (depthMatch) {
          depth = Math.max(depth, parseInt(depthMatch[1]));
        }

        // Évaluation en centipawns
        const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
        if (cpMatch) {
          evaluation = parseInt(cpMatch[1]);
        }

        // Évaluation en mat
        const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);
        if (mateMatch) {
          const mateIn = parseInt(mateMatch[1]);
          // Convertir mat en centipawns (très grand nombre)
          evaluation = mateIn > 0 ? 10000 : -10000;
        }

        // Principal variation (PV)
        const pvMatch = line.match(/pv\s+(.+)$/);
        if (pvMatch) {
          pv = pvMatch[1].trim().split(/\s+/);
        }
      }
    }

    const time = Date.now() - startTime;

    return {
      bestMove,
      evaluation,
      depth,
      time,
      pv: pv.length > 0 ? pv : undefined,
    };
  }
}

// Export d'une instance singleton
let stockfishInstance: StockfishService | null = null;

/**
 * Obtient l'instance singleton du service Stockfish
 */
export function getStockfishService(): StockfishService {
  if (!stockfishInstance) {
    stockfishInstance = new StockfishService();
  }
  return stockfishInstance;
}

