# Stockfish Service

Service d'intégration du moteur d'échecs Stockfish.js dans l'application. Ce service encapsule toute la communication avec le moteur via le protocole UCI (Universal Chess Interface).

## Architecture

Le `StockfishService` est un service singleton qui gère:
- Le chargement dynamique (lazy loading) du moteur Stockfish
- La communication asynchrone via le protocole UCI
- La configuration des niveaux de difficulté
- L'analyse de positions FEN
- La génération de coups recommandés

## Utilisation

### Initialisation

```typescript
import { getStockfishService } from "@/lib/stockfish/stockfishService";

const stockfish = getStockfishService();

// Initialiser le moteur (chargement dynamique)
await stockfish.initialize();
```

### Obtenir le meilleur coup

```typescript
const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const bestMove = await stockfish.getBestMove(fen);
console.log(bestMove); // "e2e4" (format UCI)
```

### Analyser une position

```typescript
const analysis = await stockfish.analyzePosition(fen, {
  depth: 15,
  multiPv: 3, // Obtenir les 3 meilleurs coups
});

console.log(analysis);
// {
//   bestMove: "e2e4",
//   evaluation: 25, // +0.25 pions d'avantage
//   depth: 15,
//   time: 1234,
//   pv: ["e2e4", "e7e5", "g1f3"] // Ligne principale
// }
```

### Configurer la difficulté

```typescript
import { getDifficultyLevel } from "@/lib/stockfish/difficultyLevels";

// Option 1: Utiliser un ID de niveau
await stockfish.setDifficulty("beginner");

// Option 2: Utiliser un objet DifficultyLevel complet
const level = getDifficultyLevel("intermediate");
if (level) {
  await stockfish.setDifficulty(level);
}

const easyMove = await stockfish.getBestMove(fen);
```

### Terminer le moteur

```typescript
// Libérer les ressources quand terminé
stockfish.terminate();
```

## Niveaux de difficulté

Le système propose 6 niveaux de difficulté calibrés pour différents types de joueurs :

| Niveau | Skill Level | Profondeur | Temps | ELO approximatif | Recommandé pour |
|--------|-------------|------------|-------|------------------|-----------------|
| **Débutant** (`beginner`) | 1 | 1 | 100ms | ~800 | Joueurs découvrant les échecs |
| **Joueur Occasionnel** (`casual`) | 3 | 3 | 300ms | ~1100 | Joueurs avec quelques parties d'expérience |
| **Intermédiaire** (`intermediate`) | 7 | 7 | 500ms | ~1400 | Joueurs avec des bases solides |
| **Avancé** (`advanced`) | 12 | 12 | 1000ms | ~1800 | Joueurs de club |
| **Expert** (`expert`) | 17 | 17 | 2000ms | ~2200 | Joueurs compétitifs et tournois |
| **Maître** (`master`) | 20 | 20 | 3000ms | ~2800 | Joueurs de niveau maître |

### Fonctions utilitaires pour les niveaux

```typescript
import {
  DIFFICULTY_LEVELS,
  getDifficultyLevel,
  getDefaultDifficulty,
  isValidDifficultyId,
  getAllDifficultyIds,
  getNextDifficulty,
  getPreviousDifficulty,
} from "@/lib/stockfish/difficultyLevels";

// Obtenir tous les niveaux
const allLevels = DIFFICULTY_LEVELS;

// Obtenir un niveau spécifique
const intermediate = getDifficultyLevel("intermediate");
console.log(intermediate.name); // "Intermédiaire"
console.log(intermediate.description); // Description complète
console.log(intermediate.estimatedElo); // 1400

// Obtenir le niveau par défaut (Intermédiaire)
const defaultLevel = getDefaultDifficulty();

// Valider un ID de niveau
if (isValidDifficultyId("expert")) {
  console.log("Niveau valide");
}

// Obtenir tous les IDs
const ids = getAllDifficultyIds();
// ["beginner", "casual", "intermediate", "advanced", "expert", "master"]

// Navigation entre niveaux
const next = getNextDifficulty("intermediate"); // → advanced
const prev = getPreviousDifficulty("intermediate"); // → casual
```

### Guide de sélection du niveau

| Votre niveau | Niveau recommandé |
|--------------|-------------------|
| Débutant complet | **Débutant** |
| Connaît les règles | **Joueur Occasionnel** |
| Joueur de club occasionnel | **Intermédiaire** (défaut) |
| Joueur de club régulier | **Avancé** |
| Joueur compétitif (1800+) | **Expert** |
| Joueur titré (2000+) | **Maître** |

**Conseil**: Commencez plus bas que votre niveau réel. Il vaut mieux gagner régulièrement contre un niveau inférieur que perdre constamment contre un niveau trop fort.

Pour plus de détails sur la calibration des niveaux, consultez [DIFFICULTY_CALIBRATION.md](./DIFFICULTY_CALIBRATION.md).

## Protocole UCI

Le service utilise le protocole UCI (Universal Chess Interface) pour communiquer avec Stockfish. Voici les commandes principales:

### Commandes envoyées au moteur

- `uci` - Initialiser le moteur en mode UCI
- `isready` - Vérifier si le moteur est prêt
- `position fen [FEN]` - Définir la position à analyser
- `go depth [N]` - Analyser avec une profondeur de N demi-coups
- `go movetime [MS]` - Analyser pendant MS millisecondes
- `setoption name [NAME] value [VALUE]` - Configurer une option

### Réponses du moteur

- `uciok` - Moteur initialisé
- `readyok` - Moteur prêt
- `bestmove [MOVE]` - Meilleur coup trouvé (format UCI)
- `info depth [N] score cp [SCORE] pv [MOVES]` - Informations d'analyse

### Format UCI des coups

Les coups sont au format UCI: `[from][to][promotion]`

Exemples:
- `e2e4` - Pion de e2 à e4
- `e7e8q` - Pion de e7 à e8 avec promotion en dame
- `e1g1` - Roque court des blancs (roi de e1 à g1)

## Gestion d'erreur

Le service gère plusieurs types d'erreurs:

```typescript
try {
  await stockfish.initialize();
} catch (error) {
  // WebAssembly non supporté
  // Échec de chargement du moteur
  console.error(error.message);
}

try {
  const move = await stockfish.getBestMove(fen);
} catch (error) {
  // Moteur non initialisé
  // Position FEN invalide
  // Timeout de communication
  console.error(error.message);
}
```

## Performance

- **Chargement dynamique**: Le moteur n'est chargé que lorsque nécessaire (pas dans le bundle initial)
- **Web Worker**: L'analyse s'exécute dans un worker séparé (pas de blocage UI)
- **Timeout**: Timeout de 30 secondes pour éviter les blocages
- **Singleton**: Une seule instance du moteur pour toute l'application

## Compatibilité

- **Navigateurs**: Chrome, Firefox, Safari, Edge (tous avec support WebAssembly)
- **WebAssembly**: Requis (vérifié automatiquement à l'initialisation)
- **Next.js**: Configuration webpack pour WebAssembly dans `next.config.ts`

## Types TypeScript

Tous les types sont définis dans `types/chess.ts`:

- `DifficultyLevel` - Niveaux de difficulté
- `StockfishConfig` - Configuration du moteur
- `AnalysisOptions` - Options d'analyse
- `AnalysisResult` - Résultat d'analyse
- `StockfishEngine` - Interface du Web Worker

## Exemples d'utilisation

### Dans un composant React

```typescript
"use client";

import { useEffect, useState } from "react";
import { getStockfishService } from "@/lib/stockfish/stockfishService";

export function ChessGame() {
  const [bestMove, setBestMove] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stockfish = getStockfishService();
    stockfish.initialize();

    return () => {
      stockfish.terminate();
    };
  }, []);

  const analyzePosition = async (fen: string) => {
    setLoading(true);
    try {
      const stockfish = getStockfishService();
      const move = await stockfish.getBestMove(fen);
      setBestMove(move);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => analyzePosition(currentFen)}>
        Analyser
      </button>
      {loading && <p>Analyse en cours...</p>}
      {bestMove && <p>Meilleur coup: {bestMove}</p>}
    </div>
  );
}
```

## Références

- [Stockfish](https://stockfishchess.org/) - Moteur d'échecs open source
- [Stockfish.js](https://github.com/nmrugg/stockfish.js) - Port JavaScript/WebAssembly
- [UCI Protocol](https://www.chessprogramming.org/UCI) - Documentation du protocole

