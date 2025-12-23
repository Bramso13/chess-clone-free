# Configuration et Seed des Problèmes Tactiques

Ce guide explique comment exécuter le seed des problèmes tactiques dans Supabase.

## Prérequis

### 1. Variables d'Environnement

Assurez-vous que votre fichier `.env.local` contient les variables Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
```

### 2. Schema Supabase

La table `tactical_problems` doit être créée dans votre base Supabase. Vous pouvez utiliser :

**Option A : Schema initial (recommandé si première installation)**
```bash
# Appliquer le schema principal
psql -h votre-db.supabase.co -U postgres -d postgres -f lib/supabase/schema.sql
```

**Option B : Migration de vérification (si schema déjà appliqué)**
```sql
-- Exécuter dans Supabase SQL Editor
-- Le contenu de lib/supabase/migrations/004_verify_tactical_problems_setup.sql
```

## Exécution du Seed

### Étape 1 : Vérifier la connexion

```bash
npm run test:supabase
```

Si la connexion fonctionne, vous devriez voir :
```
✅ Successfully connected to Supabase
```

### Étape 2 : Exécuter le seed

```bash
npm run seed:tactics
```

Le script va :
1. 📂 Charger les 52 problèmes depuis `data/tactics/tactical-problems-seed.json`
2. 🔍 Valider chaque problème (FEN + séquence de coups)
3. 📤 Insérer les problèmes dans Supabase
4. 📊 Afficher un rapport détaillé

### Sortie Attendue

```
============================================================
🎯 SEED DES PROBLÈMES TACTIQUES
============================================================

📂 Chargement des problèmes depuis le fichier JSON...
  ✓ 52 problèmes chargés

🔍 Validation des problèmes...
  ✓ [1/52] Facile - Mat
  ✓ [2/52] Facile - Gain de matériel
  ...
  ✓ [52/52] Difficile - Fourchette

📤 Insertion dans Supabase...
  ✓ Facile - Mat
  ✓ Facile - Gain de matériel
  ...
  ✓ Difficile - Fourchette

============================================================
📊 RÉSUMÉ
============================================================
Total de problèmes   : 52
✓ Validés            : 52
❌ Échecs validation : 0
✓ Insérés            : 52
❌ Échecs insertion  : 0
============================================================

✅ Seed terminé avec succès!
```

## Vérification dans Supabase

### Dashboard Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Table Editor** > `tactical_problems`
4. Vous devriez voir 52 entrées

### Filtres à Tester

**Par difficulté :**
```sql
SELECT COUNT(*) FROM tactical_problems WHERE difficulty = 'Facile';
-- Devrait retourner : 20

SELECT COUNT(*) FROM tactical_problems WHERE difficulty = 'Moyen';
-- Devrait retourner : 22

SELECT COUNT(*) FROM tactical_problems WHERE difficulty = 'Difficile';
-- Devrait retourner : 10
```

**Par type de tactique :**
```sql
SELECT tactic_type, COUNT(*) 
FROM tactical_problems 
GROUP BY tactic_type 
ORDER BY COUNT(*) DESC;
```

### Via Client Supabase

```typescript
import { supabase } from '@/lib/supabase/client';

// Récupérer tous les problèmes
const { data, error } = await supabase
  .from('tactical_problems')
  .select('*');

console.log('Total:', data?.length); // Devrait afficher 52

// Filtrer par difficulté
const { data: easyProblems } = await supabase
  .from('tactical_problems')
  .select('*')
  .eq('difficulty', 'Facile');

console.log('Problèmes faciles:', easyProblems?.length); // Devrait afficher 20

// Filtrer par type
const { data: forks } = await supabase
  .from('tactical_problems')
  .select('*')
  .eq('tactic_type', 'Fourchette');

console.log('Fourchettes:', forks?.length);
```

## Troubleshooting

### Erreur : "Missing Supabase environment variables"

**Solution :**
- Vérifiez que `.env.local` existe à la racine de `chess-clone-free/`
- Vérifiez que les variables sont correctement définies
- Redémarrez votre terminal après avoir modifié `.env.local`

### Erreur : "relation tactical_problems does not exist"

**Solution :**
- La table n'a pas été créée dans Supabase
- Exécutez `lib/supabase/schema.sql` dans Supabase SQL Editor
- Ou exécutez la migration 004

### Erreur : "new row violates row-level security policy"

**Solution :**
- Les policies RLS ne sont pas configurées correctement
- Exécutez `lib/supabase/migrations/002_add_insert_policies.sql`
- Ou vérifiez dans Supabase Dashboard > Authentication > Policies

### Problèmes déjà insérés

Si vous voulez réinsérer les problèmes :

```sql
-- Supprimer tous les problèmes existants
DELETE FROM tactical_problems WHERE source = 'manual';

-- Puis relancer le seed
```

### Validation échoue

Si des problèmes de validation apparaissent :
```bash
# Exécuter les tests pour identifier le problème
npm test -- __tests__/lib/supabase/seed-tactical-problems.test.ts
```

## Maintenance

### Ajouter de nouveaux problèmes

1. Éditez `data/tactics/tactical-problems-seed.json`
2. Ajoutez vos nouveaux problèmes au tableau `problems`
3. Validez le format (voir `data/tactics/README.md`)
4. Exécutez les tests : `npm test -- __tests__/lib/supabase/seed-tactical-problems.test.ts`
5. Si les tests passent, exécutez le seed : `npm run seed:tactics`

### Mettre à jour des problèmes existants

**Option 1 : Supprimer et réinsérer**
```sql
DELETE FROM tactical_problems WHERE source = 'manual';
```
Puis `npm run seed:tactics`

**Option 2 : Mise à jour manuelle**
```sql
UPDATE tactical_problems 
SET explanation = 'Nouvelle explication' 
WHERE position_fen = 'FEN_du_problème';
```

## Statistiques Actuelles

- **Total** : 52 problèmes tactiques
- **Facile** : 20 problèmes (Mat, Gain de matériel, Enfilade, Clouage, Double attaque)
- **Moyen** : 22 problèmes (Fourchette, Sacrifice, Clouage, Double attaque)
- **Difficile** : 10 problèmes (Mat complexe, Sacrifice, Fourchette, Double attaque)

**Types couverts :**
- Mat (Checkmate)
- Gain de matériel (Material Win)
- Fourchette (Fork)
- Clouage (Pin)
- Enfilade (Skewer)
- Sacrifice
- Double attaque (Double Attack)
- Découverte (Discovered Attack)

## Support

Pour toute question :
1. Consultez `data/tactics/README.md` pour la documentation complète
2. Vérifiez les tests : `__tests__/lib/supabase/seed-tactical-problems.test.ts`
3. Consultez la story : `docs/stories/4.1.tactical-problems-database-fallback.story.md`

---

**Dernière mise à jour** : 2025-12-23  
**Story** : 4.1 - Tactical Problems Database and Fallback System  
**Agent** : James (Dev)

