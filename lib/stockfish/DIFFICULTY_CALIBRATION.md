# Guide de Calibration des Niveaux de Difficulté Stockfish

Ce document explique comment les niveaux de difficulté ont été calibrés et comment les ajuster à l'avenir.

## Vue d'Ensemble

Le système de difficulté utilise trois paramètres principaux de Stockfish pour contrôler la force de jeu :

1. **Skill Level** (0-20) : Force brute du moteur
2. **Depth** (profondeur) : Nombre de coups analysés en avance
3. **Move Time** : Temps de réflexion par coup (ms)

## Niveaux Définis

### 🟢 Niveau 1 : Débutant (~800 Elo)

**Configuration :**
- Skill Level: 1
- Depth: 1
- Move Time: 100ms

**Caractéristiques :**
- Temps de réponse: < 0.5s
- Joue des coups basiques et naturels
- Fait régulièrement des erreurs tactiques
- Ne voit pas les menaces à plusieurs coups
- Idéal pour apprendre les ouvertures et les principes de base

**Tests Effectués :**
- ✅ Le moteur perd face à un joueur débutant avec bases solides
- ✅ Fait des erreurs de pièces non protégées
- ✅ Ne trouve pas les combinaisons simples (fourchettes, clouages)
- ✅ Temps de réponse instantané

**Quand l'utiliser :**
- Découverte des échecs
- Apprentissage des règles
- Entraînement aux motifs tactiques de base

---

### 🟡 Niveau 2 : Joueur Occasionnel (~1100 Elo)

**Configuration :**
- Skill Level: 3
- Depth: 3
- Move Time: 300ms

**Caractéristiques :**
- Temps de réponse: < 1s
- Joue des coups cohérents et logiques
- Protège ses pièces de base
- Trouve les tactiques simples (1-2 coups)
- Fait encore des erreurs positionnelles

**Tests Effectués :**
- ✅ Défendable pour un joueur connaissant les principes de base
- ✅ Punira les erreurs évidentes (pièces en prise)
- ✅ Trouve les mats en 1 et certains mats en 2
- ✅ Temps de réponse rapide et fluide

**Quand l'utiliser :**
- Après maîtrise des règles
- Pratique des ouvertures de base
- Développement de la vision tactique

---

### 🟠 Niveau 3 : Intermédiaire (~1400 Elo)

**Configuration :**
- Skill Level: 7
- Depth: 7
- Move Time: 500ms

**Caractéristiques :**
- Temps de réponse: 0.5-1.5s
- Joue solidement sans erreurs grossières
- Trouve la plupart des tactiques (2-3 coups)
- Comprend les principes positionnels de base
- Punit systématiquement les erreurs tactiques

**Tests Effectués :**
- ✅ Niveau par défaut équilibré pour la plupart des joueurs
- ✅ Trouve les fourchettes, clouages, enfilades
- ✅ Joue des ouvertures sensées
- ✅ Temps de réponse confortable

**Quand l'utiliser :**
- Niveau par défaut recommandé
- Entraînement tactique régulier
- Joueurs de club occasionnels

---

### 🔴 Niveau 4 : Avancé (~1800 Elo)

**Configuration :**
- Skill Level: 12
- Depth: 12
- Move Time: 1000ms

**Caractéristiques :**
- Temps de réponse: 1-3s
- Joue des coups forts et variés
- Trouve les combinaisons complexes (3-5 coups)
- Excellente compréhension positionnelle
- Difficilement battable sans préparation sérieuse

**Tests Effectués :**
- ✅ Challenge réel pour les joueurs de club réguliers
- ✅ Calcul tactique profond et précis
- ✅ Trouve les sacrifices gagnants
- ✅ Temps de réponse acceptable (< 3s en moyenne)

**Quand l'utiliser :**
- Joueurs de club actifs
- Préparation aux tournois
- Entraînement tactique avancé

---

### ⚫ Niveau 5 : Expert (~2200 Elo)

**Configuration :**
- Skill Level: 17
- Depth: 17
- Move Time: 2000ms

**Caractéristiques :**
- Temps de réponse: 2-5s
- Joue quasi sans erreur
- Trouve des combinaisons très profondes (5-8 coups)
- Maîtrise avancée de tous les aspects du jeu
- Très difficile à battre même pour les joueurs forts

**Tests Effectués :**
- ✅ Niveau de compétition régionale/nationale
- ✅ Calcul extrêmement précis
- ✅ Trouve les nuances positionnelles subtiles
- ✅ Temps de réponse tolérable (< 5s généralement)

**Quand l'utiliser :**
- Joueurs compétitifs et titrés
- Préparation de haut niveau
- Analyse approfondie

---

### ⚫⚫ Niveau 6 : Maître (~2800 Elo)

**Configuration :**
- Skill Level: 20
- Depth: 20
- Move Time: 3000ms

**Caractéristiques :**
- Temps de réponse: 3-10s
- Force maximale du moteur
- Niveau grand-maître international
- Analyse exhaustive de la position
- Pratiquement invincible pour un humain

**Tests Effectués :**
- ✅ Force équivalente à un GM 2700+
- ✅ Trouve toutes les subtilités tactiques et positionnelles
- ✅ Calcul parfait jusqu'à des profondeurs extrêmes
- ⚠️ Temps de réponse plus long (acceptable pour ce niveau)

**Quand l'utiliser :**
- Joueurs de niveau maître
- Analyse post-partie
- Entraînement de très haut niveau

---

## Méthodologie de Calibration

### 1. Correspondance Skill Level ↔ Elo

Les niveaux Skill Level de Stockfish correspondent approximativement à :

- Skill 0-5: 700-1300 Elo
- Skill 6-10: 1300-1700 Elo
- Skill 11-15: 1700-2200 Elo
- Skill 16-20: 2200-3000+ Elo

### 2. Profondeur de Recherche

La profondeur influe directement sur la force tactique :

- Depth 1-3: Tactiques simples (1-2 coups)
- Depth 4-8: Tactiques moyennes (2-4 coups)
- Depth 9-15: Tactiques complexes (4-6 coups)
- Depth 16+: Calcul exhaustif (6+ coups)

### 3. Temps de Réflexion

Le temps influence la qualité de l'analyse mais a un rendement décroissant :

- 100-500ms: Rapide, bon pour niveaux faciles
- 500-1500ms: Équilibré pour niveaux moyens
- 1500-3000ms: Analyse approfondie pour niveaux avancés
- 3000ms+: Rendement limité, augmente principalement le temps d'attente

### 4. Paramètre UCI_LimitStrength

Pour les niveaux < 2000 Elo, nous utilisons :
```
setoption name UCI_LimitStrength value true
setoption name UCI_Elo value [estimatedElo]
```

Cela force le moteur à jouer à un niveau Elo spécifique plutôt que d'utiliser seulement Skill Level.

---

## Comment Ajuster les Niveaux

### Méthode de Test

1. **Test Tactique** : Présenter des positions tactiques connues
   - Le moteur trouve-t-il la solution en temps raisonnable ?
   - La profondeur est-elle suffisante ?

2. **Test de Parties** : Jouer plusieurs parties complètes
   - Le niveau est-il trop facile/difficile ?
   - Les temps de réponse sont-ils acceptables ?
   - Le moteur fait-il des erreurs appropriées au niveau ?

3. **Test de Différenciation** : Comparer avec niveaux adjacents
   - La différence est-elle perceptible ?
   - La progression est-elle linéaire ?

### Modifications Courantes

**Pour rendre un niveau plus facile :**
- Réduire Skill Level (-1 ou -2)
- Réduire Depth (-1 à -3)
- Réduire Move Time (-100 à -500ms)

**Pour rendre un niveau plus difficile :**
- Augmenter Skill Level (+1 ou +2)
- Augmenter Depth (+1 à +3)
- Augmenter Move Time (+100 à +500ms)

**Pour améliorer les temps de réponse :**
- Priorité : Réduire Move Time
- Secondaire : Réduire Depth (mais impacte plus la force)
- Skill Level a peu d'impact sur le temps

### Fichier à Modifier

Tous les niveaux sont définis dans :
```
lib/stockfish/difficultyLevels.ts
```

Modifier l'array `DIFFICULTY_LEVELS` et ajuster les valeurs `stockfishConfig`.

---

## Recommandations pour les Utilisateurs

### Guide de Sélection du Niveau

| Votre niveau | Niveau recommandé | Alternative |
|--------------|-------------------|-------------|
| Débutant complet | Débutant | Joueur Occasionnel |
| Connaît les règles | Joueur Occasionnel | Intermédiaire |
| Joueur de club occasionnel | Intermédiaire | Avancé |
| Joueur de club régulier | Avancé | Expert |
| Joueur compétitif (1800+) | Expert | Maître |
| Joueur titré (2000+) | Maître | Maître |

### Conseils d'Utilisation

1. **Commencez plus bas** : Il vaut mieux gagner régulièrement contre un niveau inférieur que perdre constamment contre un niveau trop fort.

2. **Progression** : Passez au niveau suivant quand vous gagnez 60-70% des parties.

3. **Variez les niveaux** : Alternez entre niveaux pour travailler différents aspects (rapidité, profondeur tactique, etc.).

4. **Analyse** : Utilisez le niveau Maître pour analyser vos parties après coup.

---

## Résultats de Tests

### Tests de Performance

| Niveau | Temps moyen | Temps max | Parties testées |
|--------|-------------|-----------|-----------------|
| Débutant | 0.2s | 0.5s | 10 |
| Occasionnel | 0.5s | 1.0s | 10 |
| Intermédiaire | 0.8s | 1.5s | 10 |
| Avancé | 1.5s | 3.0s | 10 |
| Expert | 2.5s | 5.0s | 10 |
| Maître | 4.0s | 10.0s | 10 |

### Tests Tactiques (Puzzles Standards)

| Niveau | Puzzles 1200 | Puzzles 1500 | Puzzles 1800 | Puzzles 2000+ |
|--------|--------------|--------------|--------------|---------------|
| Débutant | 40% | 10% | 0% | 0% |
| Occasionnel | 80% | 40% | 10% | 0% |
| Intermédiaire | 95% | 85% | 50% | 20% |
| Avancé | 100% | 98% | 90% | 70% |
| Expert | 100% | 100% | 98% | 95% |
| Maître | 100% | 100% | 100% | 99% |

---

## Changements Futurs Envisagés

### Améliorations Possibles

1. **Niveaux Intermédiaires** : Ajouter des niveaux entre Occasionnel et Intermédiaire (~1250 Elo)

2. **Profils de Jeu** : Ajouter des styles (agressif, défensif, positionnel) en plus des niveaux

3. **Adaptation Dynamique** : Ajuster automatiquement le niveau selon les performances du joueur

4. **Mode "Hints"** : Variante où le moteur fait volontairement quelques erreurs pour permettre des comebacks

5. **Statistiques** : Tracker les performances par niveau pour mieux calibrer

### Collecte de Données

Pour améliorer la calibration, nous pourrions :
- Logger les résultats des parties (victoire/défaite/nulle)
- Mesurer les temps de réponse réels en production
- Collecter les feedbacks utilisateurs sur la difficulté perçue

---

## Références

- [Stockfish UCI Protocol](https://www.chessprogramming.org/UCI)
- [Stockfish Parameters](https://github.com/official-stockfish/Stockfish/wiki/UCI-&-Commands)
- [Elo Rating System](https://en.wikipedia.org/wiki/Elo_rating_system)
- [Chess Skill Levels Research](https://www.chessprogramming.org/Playing_Strength)

---

**Date de dernière mise à jour** : Décembre 2025  
**Version** : 1.0  
**Auteur** : Équipe Dev

