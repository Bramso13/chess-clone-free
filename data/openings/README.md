# Openings Database Documentation

Ce répertoire contient les données d'ouvertures d'échecs pour le Chess Clone Free.

## 📋 Table des matières

- [Structure des données](#structure-des-données)
- [Format JSON](#format-json)
- [Ouvertures incluses](#ouvertures-incluses)
- [Ajouter de nouvelles ouvertures](#ajouter-de-nouvelles-ouvertures)
- [Exécuter le script de seed](#exécuter-le-script-de-seed)
- [Validation des données](#validation-des-données)

## 📊 Structure des données

Les données d'ouvertures sont stockées dans `openings-seed.json` et suivent le format défini dans l'architecture de l'application.

### Interface TypeScript

```typescript
interface OpeningVariation {
  name: string;        // Nom de la variante
  moves: string[];     // Séquence de coups en notation algébrique (SAN)
}

interface OpeningData {
  name: string;              // Nom de l'ouverture
  eco_code: string;          // Code ECO (Encyclopedia of Chess Openings)
  description: string;       // Description de l'ouverture
  player_side: "white" | "black";  // Côté du joueur (blancs ou noirs)
  moves: string[];           // Ligne principale (10-15 coups minimum)
  variations: OpeningVariation[];  // 2-3 variantes principales
}
```

## 📝 Format JSON

Le fichier `openings-seed.json` contient un objet avec un tableau `openings`:

```json
{
  "openings": [
    {
      "name": "Ruy Lopez",
      "eco_code": "C70",
      "description": "L'une des ouvertures les plus anciennes et les plus classiques...",
      "player_side": "white",
      "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", ...],
      "variations": [
        {
          "name": "Marshall Attack",
          "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", ...]
        }
      ]
    }
  ]
}
```

### Règles de format

1. **Notation des coups**: Utiliser la notation algébrique standard (SAN)
   - Exemples: `"e4"`, `"Nf3"`, `"Bb5"`, `"O-O"`, `"Qxd5"`
   
2. **Ligne principale**: Minimum 10-15 coups pour fournir suffisamment de contexte

3. **Variantes**: Au moins 2-3 variantes principales par ouverture

4. **Code ECO**: Code à 3 caractères (lettre + 2 chiffres)
   - Exemples: `"C70"`, `"B50"`, `"E60"`

5. **Player Side**: Indique quel côté joue l'utilisateur
   - `"white"`: L'utilisateur joue les blancs (ouvertures blanches)
   - `"black"`: L'utilisateur joue les noirs (défenses)

## 🎯 Ouvertures incluses

Le fichier contient actuellement **7 ouvertures populaires**:

| Ouverture | Code ECO | Premier coup | Type | Player Side |
|-----------|----------|--------------|------|-------------|
| Ruy Lopez | C70 | 1.e4 | Ouverte | ♔ White |
| Sicilian Defense | B50 | 1.e4 c5 | Semi-ouverte | ♚ Black |
| French Defense | C10 | 1.e4 e6 | Semi-ouverte | ♚ Black |
| Italian Game | C50 | 1.e4 e5 | Ouverte | ♔ White |
| Queen's Gambit | D06 | 1.d4 d5 | Fermée | ♔ White |
| King's Indian Defense | E60 | 1.d4 Nf6 | Indienne | ♚ Black |
| Caro-Kann Defense | B10 | 1.e4 c6 | Semi-ouverte | ♚ Black |

Chaque ouverture contient 3 variantes principales.

## ➕ Ajouter de nouvelles ouvertures

Pour ajouter une nouvelle ouverture:

### 1. Rechercher les informations

- **Nom de l'ouverture**: Nom complet et officiel
- **Code ECO**: Consulter [ECO Codes](https://www.chessgames.com/chessecohelp.html)
- **Ligne principale**: Minimum 10-15 coups
- **Variantes**: 2-3 variantes les plus jouées
- **Player Side**: Déterminer si c'est une ouverture blanche ou noire (voir guide ci-dessous)

#### Déterminer le Player Side

**Ouvertures blanches** (`"white"`):
- L'utilisateur joue les blancs et commence la partie
- Exemples: Ruy Lopez, Italian Game, Queen's Gambit
- Premier coup typique: `e4`, `d4`, `Nf3`, `c4`, `g3`, `b3`, `f4`

**Ouvertures noires** (`"black"`):
- L'utilisateur joue les noirs et répond aux coups blancs
- Ce sont généralement des "défenses" ou "contre-gambit"
- Exemples: Sicilian Defense, French Defense, Caro-Kann Defense
- Le nom contient souvent "Defense" ou "Gambit Declined"

**Règle simple**: 
- Si le premier coup de la ligne principale est un coup blanc typique (`e4`, `d4`, etc.) → `"white"`
- Si le nom contient "Defense", "Defence", "Counter" → généralement `"black"`

### 2. Éditer `openings-seed.json`

Ajouter une nouvelle entrée dans le tableau `openings`:

```json
{
  "name": "Nouvelle Ouverture",
  "eco_code": "X99",
  "description": "Description de l'ouverture",
  "player_side": "white",
  "moves": ["e4", "c5", "Nf3", ...],
  "variations": [
    {
      "name": "Variante 1",
      "moves": ["e4", "c5", ...]
    },
    {
      "name": "Variante 2",
      "moves": ["e4", "c5", ...]
    }
  ]
}
```

### 3. Valider les coups

Avant d'exécuter le seed, validez que tous les coups sont légaux:

```bash
npm test -- __tests__/lib/supabase/seed-openings.test.ts
```

Ou utilisez le script de validation intégré dans le seed (voir ci-dessous).

### 4. Exécuter le seed

Une fois validé, exécutez le script de seed pour insérer dans Supabase.

## 🚀 Exécuter le script de seed

### Prérequis

1. **Variables d'environnement**: Assurez-vous que `.env.local` contient:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Base de données**: La table `openings` doit exister dans Supabase
   - Le schéma est défini dans `lib/supabase/schema.sql`

### Commande

```bash
npm run seed:openings
```

### Processus

Le script effectue automatiquement les étapes suivantes:

1. **Chargement**: Lit `data/openings/openings-seed.json`
2. **Validation**: Valide chaque séquence de coups avec chess.js
3. **Insertion**: Insère les données dans Supabase avec upsert
4. **Logs**: Affiche la progression et les erreurs éventuelles

### Output attendu

```
🎯 Début du processus de seed des ouvertures
============================================================
📂 Chargement des données depuis: /path/to/openings-seed.json
✅ 7 ouvertures chargées

============================================================
🔍 VALIDATION DES COUPS
============================================================

🔍 Validation de l'ouverture: Ruy Lopez
✅ [Ruy Lopez - Ligne principale] 15 coups validés avec succès
✅ [Ruy Lopez - Marshall Attack] 16 coups validés avec succès
...

✅ Toutes les séquences de coups sont valides!

============================================================
💾 INSERTION DANS SUPABASE
============================================================
🔗 Connexion à Supabase: https://your-project.supabase.co
📥 Insertion de 7 ouvertures dans Supabase...
✅ "Ruy Lopez" (C70) inséré avec succès
✅ "Sicilian Defense" (B50) inséré avec succès
...

============================================================
✅ Processus de seed terminé avec succès!
============================================================
```

### Gestion des duplications

Le script utilise `upsert` avec `eco_code` comme clé unique:
- Si une ouverture avec le même `eco_code` existe, elle sera mise à jour
- Sinon, une nouvelle entrée sera créée

## ✅ Validation des données

### Tests automatisés

Le projet inclut des tests Vitest pour valider la logique de validation:

```bash
npm test
```

### Validation manuelle

Pour valider un coup spécifique:

```typescript
import { validateOpeningMoves } from "@/lib/supabase/seed-openings";

const moves = ["e4", "e5", "Nf3"];
const isValid = validateOpeningMoves(moves, "Test Opening");
console.log(isValid); // true ou false
```

### Critères de validation

Un coup est considéré valide si:
- ✅ La notation est correcte (SAN)
- ✅ Le coup est légal selon les règles d'échecs
- ✅ Le coup peut être joué dans la position actuelle
- ✅ C'est le tour du bon joueur

## 🔧 Dépannage

### Erreur: "Variables d'environnement Supabase manquantes"

**Solution**: Vérifiez que `.env.local` existe et contient les bonnes variables:
```bash
cat .env.local
```

### Erreur: "Coup invalide"

**Solution**: 
1. Vérifiez la notation du coup (SAN correcte)
2. Assurez-vous que la séquence complète est jouable
3. Testez la séquence manuellement sur un échiquier

### Erreur: "Permission denied" lors de l'insertion

**Solution**: 
1. Vérifiez les RLS policies dans Supabase
2. Pour le MVP, les policies doivent permettre l'insertion publique
3. Consultez `lib/supabase/schema.sql` pour le SQL des policies

## 📚 Ressources

- [Chess.js Documentation](https://github.com/jhlywa/chess.js)
- [ECO Codes](https://www.chessgames.com/chessecohelp.html)
- [Algebraic Notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))
- [Supabase Documentation](https://supabase.com/docs)

## 📄 Licence

Données d'ouvertures basées sur la théorie d'échecs du domaine public.

