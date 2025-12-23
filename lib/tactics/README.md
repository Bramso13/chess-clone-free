# Service de Génération de Problèmes Tactiques

Ce service permet de générer automatiquement des problèmes tactiques d'échecs en analysant des parties existantes avec Stockfish.

## Vue d'ensemble

Le système de génération utilise une approche MVP (Minimum Viable Product) qui analyse des parties d'échecs au format PGN pour identifier des positions tactiques intéressantes. Chaque position est analysée avec Stockfish pour détecter les opportunités tactiques et générer des problèmes complets avec solution, difficulté et explication.

## Architecture

### Composants principaux

1. **TacticGeneratorService** (`tacticGeneratorService.ts`)
   - Service principal de génération
   - Analyse de positions avec Stockfish
   - Détection et classification de tactiques
   - Génération d'explications et estimation de difficulté

2. **Script de génération batch** (`generate-tactics-batch.ts`)
   - Script CLI pour génération en masse
   - Utilisable depuis la ligne de commande

3. **Interface de génération** (`components/tactics/TacticGenerator.tsx`)
   - Interface utilisateur pour génération interactive
   - Sélection du nombre de coups souhaité
   - Visualisation avec animation

4. **Composant d'animation** (`components/tactics/TacticAnimationPlayer.tsx`)
   - Animation automatique des solutions
   - Contrôles de lecture (play/pause, vitesse, navigation)

## Utilisation

### Génération via script CLI

```bash
# Générer 20 tactiques par défaut
npm run generate:tactics

# Générer 10 tactiques avec 2-3 coups
npm run generate:tactics -- --count=10 --minMoves=2 --maxMoves=3

# Générer uniquement des tactiques de 5 coups exactement
npm run generate:tactics -- --exactMoves=5 --count=15

# Générer avec profondeur d'analyse personnalisée
npm run generate:tactics -- --depth=25 --count=20

# Utiliser un fichier PGN personnalisé
npm run generate:tactics -- --pgnFile=./path/to/games.pgn
```

### Génération via interface web

1. Accéder à `/tactics/generate`
2. Sélectionner le nombre de coups souhaité (2-3, 4-5, 6+, ou personnalisé)
3. Cliquer sur "Générer"
4. Examiner chaque tactique générée avec l'animation
5. Sauvegarder ou ignorer chaque tactique individuellement

### Utilisation programmatique

```typescript
import { TacticGeneratorService } from "@/lib/tactics/tacticGeneratorService";
import { getStockfishService } from "@/lib/stockfish/stockfishService";

// Initialiser le service
const stockfishService = getStockfishService();
await stockfishService.initialize();
const generatorService = new TacticGeneratorService(stockfishService);

// Parser des parties PGN
const pgnContent = "..."; // Contenu PGN
const games = generatorService.parsePGN(pgnContent);

// Générer des tactiques
const tactics = await generatorService.generateTacticsFromGames(games, {
  minMoves: 2,
  maxMoves: 3,
  count: 10,
});

// Sauvegarder une tactique
for (const tactic of tactics) {
  try {
    await generatorService.saveTactic(tactic);
    console.log("Tactique sauvegardée:", tactic.tactic_type);
  } catch (error) {
    console.error("Erreur:", error);
  }
}
```

## Processus de génération

### 1. Collecte de parties

Les parties sont stockées dans `data/tactics/games-source.pgn` au format PGN standard. Le service peut parser plusieurs parties dans un même fichier.

### 2. Extraction de positions

Pour chaque partie, toutes les positions intermédiaires sont extraites et converties en notation FEN.

### 3. Analyse avec Stockfish

Chaque position est analysée avec Stockfish (profondeur par défaut: 20) pour obtenir:
- L'évaluation de la position (en centipawns)
- Le meilleur coup
- La ligne principale (Principal Variation)

### 4. Détection de tactiques

Une tactique est détectée si:
- Le delta d'évaluation est significatif (> 200 centipawns)
- La longueur de la solution correspond aux critères de filtrage (minMoves/maxMoves/exactMoves)

### 5. Classification

Le type de tactique est déterminé par des heuristiques basiques:
- **Mat**: Position finale est un échec et mat
- **Fourchette**: Premier coup est un cavalier avec capture
- **Double attaque**: Plusieurs coups avec captures
- **Gain de matériel**: Capture simple avec 1-2 coups
- **Combinaison**: Par défaut pour les autres cas

### 6. Estimation de difficulté

Basée sur la longueur de la solution:
- **Facile**: 1-2 coups
- **Moyen**: 3-4 coups
- **Difficile**: 5+ coups

### 7. Génération d'explication

Des templates prédéfinis génèrent des explications basiques selon le type de tactique.

### 8. Stockage

Les tactiques sont sauvegardées dans Supabase avec vérification de duplications (même position FEN).

## Limitations actuelles (MVP)

1. **Classification basique**: Les heuristiques de classification sont simples et peuvent être améliorées
2. **Explications génériques**: Les explications utilisent des templates, pas d'analyse détaillée
3. **Pas de validation de qualité**: Toutes les tactiques détectées sont générées sans filtrage de qualité
4. **Performance**: L'analyse Stockfish peut être lente pour de grandes quantités
5. **Source de données limitée**: Utilise uniquement le fichier PGN local

## Améliorations futures

### Court terme
- [ ] Validation de qualité des tactiques générées
- [ ] Filtrage des positions ambiguës ou peu claires
- [ ] Amélioration des heuristiques de classification
- [ ] Explications plus détaillées avec analyse des coups

### Moyen terme
- [ ] Intégration avec Lichess API pour télécharger des parties
- [ ] Système de scoring pour qualité des problèmes
- [ ] Détection automatique de motifs spécifiques (pins, skewers, etc.)
- [ ] Génération de positions aléatoires ciblées

### Long terme
- [ ] Machine Learning pour classification des tactiques
- [ ] Génération de positions ciblées par type de tactique
- [ ] Système de feedback utilisateur pour améliorer la qualité
- [ ] Génération par batch avec file d'attente pour grandes quantités
- [ ] Interface de génération améliorée avec prévisualisation en temps réel

## Structure des données

### GeneratedTactic

```typescript
interface GeneratedTactic {
  position_fen: string;           // Position initiale en FEN
  solution_moves: string[];        // Séquence de coups en SAN
  difficulty: "Facile" | "Moyen" | "Difficile";
  tactic_type: TacticType;         // Type de tactique
  explanation: string;             // Explication textuelle
  source: "generated";             // Source du problème
}
```

### GenerationOptions

```typescript
interface GenerationOptions {
  minMoves?: number;      // Nombre minimum de coups
  maxMoves?: number;      // Nombre maximum de coups
  exactMoves?: number;    // Nombre exact de coups (prioritaire)
  depth?: number;         // Profondeur d'analyse Stockfish
  count?: number;        // Nombre de tactiques à générer
}
```

## Fichiers de données

- **`data/tactics/games-source.pgn`**: Fichier PGN contenant les parties à analyser
- Format PGN standard avec métadonnées et coups

## Tests

Les tests unitaires sont disponibles dans `__tests__/lib/tactics/tacticGeneratorService.test.ts`.

Exécuter les tests:
```bash
npm test -- __tests__/lib/tactics/tacticGeneratorService.test.ts
```

## Dépannage

### Erreur: "Le moteur n'est pas initialisé"
- Assurez-vous que Stockfish est correctement chargé
- Vérifiez que les fichiers `stockfish.js` et `stockfish.wasm` sont présents dans `public/`

### Erreur: "Aucune partie trouvée dans le fichier PGN"
- Vérifiez que le fichier PGN existe et contient des parties valides
- Vérifiez le format PGN (doit commencer par `[Event`)

### Génération lente
- Réduisez la profondeur d'analyse (`--depth=15`)
- Réduisez le nombre de tactiques à générer (`--count=5`)
- Utilisez un fichier PGN plus petit

### Aucune tactique générée
- Vérifiez que les parties contiennent des positions tactiques
- Essayez d'augmenter la profondeur d'analyse
- Vérifiez les critères de filtrage (peut-être trop restrictifs)

## Contribution

Pour améliorer le système de génération:
1. Améliorer les heuristiques de classification dans `classifyTacticType()`
2. Ajouter de nouveaux templates d'explication dans `generateExplanation()`
3. Améliorer la détection de tactiques dans `detectTactic()`
4. Ajouter des tests pour les nouveaux cas

