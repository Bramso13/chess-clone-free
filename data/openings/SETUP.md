# Configuration Supabase pour le Seed des Ouvertures

## 📋 Prérequis

Avant d'exécuter le script de seed (`npm run seed:openings`), vous devez configurer Supabase avec les policies et contraintes nécessaires.

## 🔧 Étapes de configuration

### Étape 1: Accéder au SQL Editor dans Supabase

1. Ouvrez votre projet Supabase: https://vqpxacnkmxtwiqbidfpl.supabase.co
2. Naviguez vers **SQL Editor** dans le menu de gauche

### Étape 2: Exécuter la migration SQL

Copiez et exécutez le contenu du fichier suivant dans le SQL Editor:

```
lib/supabase/migrations/002_add_insert_policies.sql
```

Ou copiez directement ce SQL:

```sql
-- Supprimer les policies existantes si elles existent déjà
DROP POLICY IF EXISTS "Allow public insert on openings" ON openings;
DROP POLICY IF EXISTS "Allow public insert on tactical_problems" ON tactical_problems;

-- Ajouter les policies d'insertion publique (MVP only)
CREATE POLICY "Allow public insert on openings"
    ON openings
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public insert on tactical_problems"
    ON tactical_problems
    FOR INSERT
    WITH CHECK (true);

-- Ajouter une contrainte unique sur eco_code
ALTER TABLE openings ADD CONSTRAINT openings_eco_code_key UNIQUE (eco_code);
```

### Étape 3: Vérifier l'exécution

Vérifiez que les policies ont été créées:

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('openings', 'tactical_problems')
ORDER BY tablename, policyname;
```

Vous devriez voir:

- `Allow public read access on openings` (SELECT)
- `Allow public insert on openings` (INSERT)
- `Allow public read access on tactical_problems` (SELECT)
- `Allow public insert on tactical_problems` (INSERT)

### Étape 4: Vérifier la contrainte unique

```sql
SELECT
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'openings'
AND constraint_name = 'openings_eco_code_key';
```

## 🚀 Exécution du seed

Une fois la configuration Supabase terminée:

```bash
npm run seed:openings
```

## ✅ Vérification des données

Après l'exécution du seed, vérifiez dans Supabase:

### Via SQL Editor:

```sql
SELECT
    name,
    eco_code,
    array_length(moves::json::text[], 1) as nb_moves,
    jsonb_array_length(variations) as nb_variations
FROM openings
ORDER BY name;
```

### Via Table Editor:

1. Naviguez vers **Table Editor**
2. Sélectionnez la table **openings**
3. Vous devriez voir 7 ouvertures

## 🔒 Note de sécurité

⚠️ **Important**: Les policies `Allow public insert` sont appropriées pour le MVP sans authentification, mais **doivent être supprimées ou restreintes en production**.

En production, considérez:

- Utiliser une clé `service_role` pour le seeding
- Restreindre les INSERT aux utilisateurs authentifiés et autorisés
- Ajouter des policies UPDATE et DELETE selon les besoins

## 🐛 Dépannage

### Erreur: "new row violates row-level security policy"

**Cause**: La policy d'insertion n'existe pas

**Solution**: Exécutez la migration SQL (Étape 2 ci-dessus)

### Erreur: "there is no unique or exclusion constraint matching"

**Cause**: La contrainte unique sur `eco_code` n'existe pas

**Solution**: Exécutez `ALTER TABLE` pour ajouter la contrainte (Étape 2 ci-dessus)

### Erreur: "constraint already exists"

**Cause**: La contrainte existe déjà

**Solution**: C'est normal, ignorez cette erreur

## 📚 Ressources

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
