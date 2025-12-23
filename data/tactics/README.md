# Problèmes Tactiques - Documentation

Ce dossier contient les données des problèmes tactiques utilisés pour l'entraînement aux échecs.

## Structure des Données

### Format JSON

Les problèmes tactiques sont stockés dans `tactical-problems-seed.json` avec la structure suivante :

```json
{
  "problems": [
    {
      "position_fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      "solution_moves": ["Bxf7+", "Ke7", "Nd5"],
      "difficulty": "Facile",
      "tactic_type": "Fourchette",
      "explanation": "Le cavalier en d5 fait une fourchette royale sur le roi en e7 et la dame en d8 après le sacrifice du fou en f7.",
      "source": "manual"
    }
  ]
}
```

### Champs Obligatoires

| Champ | Type | Description | Valeurs Possibles |
|-------|------|-------------|-------------------|
| `position_fen` | string | Position initiale en notation FEN | Format FEN valide |
| `solution_moves` | string[] | Séquence de coups solution | Notation SAN (ex: "Nf3", "Bxf7+", "O-O") |
| `difficulty` | string | Niveau de difficulté | "Facile", "Moyen", "Difficile" |
| `tactic_type` | string | Type de tactique | Voir liste ci-dessous |
| `explanation` | string | Explication de la tactique | 2-3 phrases claires |
| `source` | string | Source du problème | "manual", "generated", "imported" |

## Types de Tactiques Supportés

### Tactiques de Base
- **Fourchette** (Fork) : Une pièce attaque deux pièces adverses simultanément
- **Clouage** (Pin) : Une pièce ne peut bouger sans exposer une pièce plus importante
- **Enfilade** (Skewer) : Une pièce importante est forcée de bouger, exposant une pièce derrière elle
- **Découverte** (Discovered Attack) : Un coup révèle une attaque d'une autre pièce

### Tactiques Avancées
- **Double attaque** (Double Attack) : Deux menaces simultanées
- **Mat** (Checkmate) : Séquence menant au mat
- **Gain de matériel** (Material Win) : Séquence gagnant du matériel
- **Sacrifice** (Sacrifice) : Sacrifice de matériel pour avantage positionnel ou tactique

## Niveaux de Difficulté

### Facile
- Tactiques en 1-2 coups
- Motifs tactiques évidents
- Pour joueurs débutants à intermédiaires (~800-1400 Elo)
- Exemples : fourchettes simples, mat en 1

### Moyen
- Tactiques en 2-4 coups
- Requiert calcul et visualisation
- Pour joueurs intermédiaires à avancés (~1400-1800 Elo)
- Exemples : combinaisons multi-coups, sacrifices simples

### Difficile
- Tactiques en 4+ coups
- Requiert calcul profond et précision
- Pour joueurs avancés à experts (~1800+ Elo)
- Exemples : sacrifices complexes, combinaisons forcing

## Comment Ajouter de Nouveaux Problèmes

### 1. Trouver un Problème

Sources recommandées :
- [Lichess Puzzles](https://lichess.org/training) (licence libre)
- [ChessTempo](https://chesstempo.com/)
- Livres de tactiques classiques
- Parties de maîtres

### 2. Extraire les Informations

**Position FEN** :
- Utilisez un outil comme [Lichess Board Editor](https://lichess.org/editor)
- Ou copiez depuis une partie existante

**Coups Solution** :
- Notez tous les coups en notation SAN (Standard Algebraic Notation)
- Incluez les coups de l'adversaire si nécessaires pour la séquence
- Exemples : `"Nf3"`, `"Bxf7+"`, `"O-O"`, `"Qxh7#"`

### 3. Valider le Problème

Avant d'ajouter le problème au fichier JSON, vérifiez :

✅ La position FEN est valide (testez sur lichess.org/editor)  
✅ Tous les coups de solution sont légaux  
✅ La séquence mène bien à l'avantage tactique décrit  
✅ La difficulté est appropriée  
✅ L'explication est claire et éducative  

### 4. Ajouter au Fichier JSON

Ajoutez votre problème dans le tableau `problems` de `tactical-problems-seed.json` :

```json
{
  "position_fen": "VOTRE_FEN_ICI",
  "solution_moves": ["Coup1", "Coup2", "Coup3"],
  "difficulty": "Moyen",
  "tactic_type": "Fourchette",
  "explanation": "Votre explication claire et pédagogique.",
  "source": "manual"
}
```

### 5. Valider et Tester

Exécutez le script de validation pour vérifier votre problème :

```bash
npm run seed:tactics
```

Le script validera automatiquement :
- ✅ Position FEN valide
- ✅ Tous les coups sont légaux
- ✅ Format JSON correct

## Exécuter le Seed

### Prérequis

1. Variables d'environnement Supabase configurées dans `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé
   ```

2. Schema Supabase appliqué (table `tactical_problems` créée)

### Commandes

**Exécuter le seed complet** :
```bash
npm run seed:tactics
```

Le script :
1. 📂 Charge les problèmes depuis `tactical-problems-seed.json`
2. 🔍 Valide chaque problème (FEN + coups)
3. 📤 Insert les problèmes validés dans Supabase
4. 📊 Affiche un rapport détaillé

**Vérifier la connexion Supabase** :
```bash
npm run test:supabase
```

## Exemples de Problèmes

### Exemple 1 : Fourchette Simple (Facile)

```json
{
  "position_fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "solution_moves": ["Bxf7+", "Ke7", "Nd5"],
  "difficulty": "Facile",
  "tactic_type": "Fourchette",
  "explanation": "Le cavalier en d5 fait une fourchette royale sur le roi en e7 et la dame en d8.",
  "source": "manual"
}
```

### Exemple 2 : Mat en 2 (Moyen)

```json
{
  "position_fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP1QPPP/R1B2RK1 w - - 0 9",
  "solution_moves": ["Bxf7+", "Kh8", "Ng5"],
  "difficulty": "Moyen",
  "tactic_type": "Mat",
  "explanation": "Le sacrifice du fou suivi de Ng5 menace Qh5 avec mat imparable.",
  "source": "manual"
}
```

### Exemple 3 : Sacrifice Complexe (Difficile)

```json
{
  "position_fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQ - 0 7",
  "solution_moves": ["Ng5", "O-O", "Qh5"],
  "difficulty": "Difficile",
  "tactic_type": "Mat",
  "explanation": "L'attaque Ng5 suivi de Qh5 menace Qxh7#. Les noirs doivent sacrifier du matériel.",
  "source": "manual"
}
```

## Notation Échecs - Rappel

### Pièces
- K = Roi (King)
- Q = Dame (Queen)
- R = Tour (Rook)
- B = Fou (Bishop)
- N = Cavalier (Knight)
- (rien) = Pion

### Symboles
- `x` = capture (ex: Nxe5)
- `+` = échec (ex: Qf7+)
- `#` = mat (ex: Qh7#)
- `O-O` = petit roque
- `O-O-O` = grand roque
- `=Q` = promotion (ex: e8=Q)

### Cases
- Colonnes : a-h (de gauche à droite)
- Rangées : 1-8 (bas en haut pour les blancs)
- Exemple : e4, d5, f7

## Maintenance

### Mettre à Jour les Problèmes

Pour modifier un problème existant :
1. Modifiez le fichier `tactical-problems-seed.json`
2. Ré-exécutez `npm run seed:tactics`
3. Le script INSERT n'ajoutera que les nouveaux problèmes

Pour réinitialiser complètement :
1. Supprimez les données dans Supabase Dashboard
2. Ré-exécutez `npm run seed:tactics`

### Statistiques Actuelles

- **Total de problèmes** : 56
- **Facile** : ~20
- **Moyen** : ~28
- **Difficile** : ~8
- **Types couverts** : 8 (Fourchette, Clouage, Découverte, Mat, Gain de matériel, Enfilade, Double attaque, Sacrifice)

## Troubleshooting

### Erreur : "Position FEN invalide"
- Vérifiez le format FEN sur [lichess.org/editor](https://lichess.org/editor)
- Assurez-vous d'inclure tous les composants (position, tour, roque, en passant, etc.)

### Erreur : "Coup invalide"
- Vérifiez la notation SAN (ex: `Nf3` pas `Knight to f3`)
- Testez les coups manuellement sur un échiquier
- Vérifiez que c'est le bon tour (blanc/noir)

### Erreur : "Connection failed"
- Vérifiez vos variables d'environnement `.env.local`
- Testez avec `npm run test:supabase`
- Vérifiez que la table existe dans Supabase Dashboard

## Ressources

- [Chess.js Documentation](https://github.com/jhlywa/chess.js)
- [FEN Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [SAN Notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))
- [Lichess Board Editor](https://lichess.org/editor)
- [Supabase Documentation](https://supabase.com/docs)

## Support

Pour toute question ou problème :
1. Vérifiez cette documentation
2. Consultez les logs du script de seed
3. Vérifiez les tests unitaires dans `__tests__/lib/supabase/seed-tactical-problems.test.ts`

---

Dernière mise à jour : 2025-12-23  
Story : 4.1 - Tactical Problems Database and Fallback System

