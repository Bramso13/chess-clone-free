# Import de Puzzles Tactiques Lichess

Ce document explique comment importer des puzzles tactiques depuis un fichier CSV Lichess dans la base de données Supabase.

## Prérequis

1. **Fichier CSV Lichess** : Un fichier CSV contenant les puzzles tactiques Lichess doit être placé dans `data/tactics/lichess-puzzles.csv`
2. **Variables d'environnement** : Les variables suivantes doivent être configurées dans `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase

## Format du Fichier CSV

Le fichier CSV doit contenir les colonnes suivantes (en-têtes exacts requis) :

| Colonne | Type | Description | Requis |
|---------|------|-------------|--------|
| `PuzzleId` | string | Identifiant unique du puzzle Lichess | ✅ |
| `FEN` | string | Position initiale en notation FEN | ✅ |
| `Moves` | string | Séquence de coups solution en format UCI (ex: "e2e4 e7e5") | ✅ |
| `Rating` | number | Rating du puzzle (utilisé pour déterminer la difficulté) | ✅ |
| `RatingDeviation` | number | Écart-type du rating | ❌ |
| `Popularity` | number | Popularité du puzzle | ❌ |
| `NbPlays` | number | Nombre de fois que le puzzle a été joué | ❌ |
| `themes` | string | Types de tactiques (séparés par virgule, ex: "fork,pin") | ❌ |
| `GameUrl` | string | URL vers la partie source sur Lichess | ❌ |
| `OpeningTags` | string | Tags d'ouverture associés (ex: "C20") | ❌ |

### Format des Données

- **FEN** : Doit être une position FEN valide (ex: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`)
- **Moves** : Coups en format UCI séparés par des espaces (ex: `e2e4 e7e5 g1f3`)
- **Rating** : Nombre entier (ex: `1500`)
- **themes** : Chaîne de caractères avec plusieurs themes séparés par virgule ou pipe (ex: `fork,pin` ou `fork|pin`)

### Exemple de Ligne CSV

```csv
PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,themes,GameUrl,OpeningTags
puzzle1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5,1500,50,100,1000,fork,https://lichess.org/game1,C20
puzzle2,rnbqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4,b4f8 e8f8 d5f8,1800,75,200,2000,pin sacrifice,https://lichess.org/game2,C70
```

## Exécution du Script

Pour importer les puzzles, exécutez la commande suivante :

```bash
npm run seed:lichess-tactics
```

Le script effectuera les étapes suivantes :

1. **Lecture du fichier CSV** : Lit `data/tactics/lichess-puzzles.csv`
2. **Parsing CSV** : Parse le contenu CSV et valide les colonnes essentielles
3. **Validation** : Valide chaque puzzle (FEN valide, coups légaux, etc.)
4. **Détection de doublons** : Identifie les puzzles avec la même position FEN
5. **Insertion dans Supabase** : Insère les puzzles valides dans la table `tactical_problems`

## Interprétation du Rapport d'Import

Le script affiche un rapport détaillé à la fin de l'exécution :

```
📊 RÉSUMÉ
============================================================
Total dans CSV        : 100
✓ Parsés              : 98
✓ Validés             : 95
❌ Invalides          : 3
⚠️  Doublons           : 2
✓ Insérés (nouveaux)  : 93
⏭️  Ignorés (existants): 0
⏱️  Temps d'exécution  : 12.34s
```

### Statistiques

- **Total dans CSV** : Nombre total de lignes dans le CSV (hors header)
- **Parsés** : Nombre de puzzles parsés avec succès depuis le CSV
- **Validés** : Nombre de puzzles valides après validation (FEN valide, coups légaux)
- **Invalides** : Nombre de puzzles rejetés lors de la validation
- **Doublons** : Nombre de groupes de puzzles avec la même position FEN
- **Insérés** : Nombre de nouveaux puzzles insérés dans la base de données
- **Ignorés** : Nombre de puzzles ignorés car ils existent déjà dans la base (même FEN)

### Gestion des Erreurs

Le script affiche les erreurs rencontrées :
- Erreurs de parsing (colonnes manquantes, format invalide)
- Erreurs de validation (FEN invalide, coups invalides)
- Erreurs d'insertion (problèmes de connexion Supabase, etc.)

## Conversion des Données

### Rating vers Difficulté

Le script convertit automatiquement le rating Lichess vers notre système de difficulté :

- **Rating < 1400** → `Facile`
- **Rating 1400-1799** → `Moyen`
- **Rating >= 1800** → `Difficile`

### Themes vers Type de Tactique

Le script mappe les themes Lichess vers nos types de tactiques :

| Theme Lichess | Type de Tactique |
|---------------|------------------|
| `fork` | Fourchette |
| `pin` | Clouage |
| `skewer` | Enfilade |
| `discoveredAttack` | Découverte |
| `mate`, `mateIn1`, `mateIn2`, etc. | Mat |
| `sacrifice` | Sacrifice |
| `doubleCheck` | Double attaque |
| Autres | Gain de matériel (par défaut) |

Si plusieurs themes sont présents, le premier theme connu est utilisé.

### Format des Coups

Les coups sont convertis automatiquement de **UCI** (format Lichess) vers **SAN** (notation algébrique standard) :

- UCI : `e2e4 e7e5`
- SAN : `["e4", "e5"]`

## Gestion des Doublons

Le script détecte automatiquement les doublons basés sur la position FEN. Si plusieurs puzzles ont la même position FEN :
- Le script garde seulement le premier puzzle de chaque groupe
- Les autres sont ignorés pour éviter les doublons dans la base de données

## Limitations Connues

1. **Taille du fichier CSV** : Pour de très gros fichiers (plusieurs dizaines de milliers de puzzles), l'insertion peut prendre du temps. Le script traite les données par batch de 50 puzzles.

2. **Validation FEN** : Le script valide que le FEN est syntaxiquement correct et chargeable avec chess.js, mais ne vérifie pas si la position est légalement atteignable dans une partie réelle.

3. **Métadonnées optionnelles** : Les colonnes optionnelles (RatingDeviation, Popularity, NbPlays, GameUrl, OpeningTags) sont stockées mais ne sont pas utilisées dans l'interface MVP. Elles seront disponibles pour des fonctionnalités futures.

4. **Idempotence** : Le script est idempotent - vous pouvez l'exécuter plusieurs fois sans créer de doublons. Les puzzles existants (même FEN) seront ignorés.

## Dépannage

### Erreur : "Impossible de lire le fichier CSV"

Vérifiez que le fichier existe à `data/tactics/lichess-puzzles.csv` et que le chemin est correct.

### Erreur : "Missing Supabase environment variables"

Vérifiez que les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont définies dans `.env.local`.

### Erreur : "Position FEN invalide"

Le FEN fourni dans le CSV n'est pas valide. Vérifiez le format du FEN dans votre fichier CSV.

### Erreur : "Coup invalide"

Les coups UCI dans la colonne `Moves` ne sont pas valides pour la position FEN donnée. Vérifiez la cohérence entre le FEN et les coups.

### Tous les puzzles sont ignorés (doublons)

Tous les puzzles du CSV existent déjà dans la base de données. Pour réimporter, vous devrez d'abord supprimer les puzzles existants depuis Supabase Dashboard.

## Fichier CSV d'Exemple

Un fichier d'exemple avec quelques puzzles peut être créé pour tester le script. Placez-le à `data/tactics/lichess-puzzles.csv.example` avec le format décrit ci-dessus.

