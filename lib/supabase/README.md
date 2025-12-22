# Supabase Integration

Ce dossier contient les fichiers nécessaires pour l'intégration Supabase dans l'application Chess Clone.

## Fichiers

- `client.ts` - Client Supabase pour utilisation côté browser (Client Components)
- `server.ts` - Client Supabase pour utilisation côté serveur (API Routes, Server Components)
- `schema.sql` - Script SQL complet pour créer le schéma de base de données
- `test-connection.ts` - Script de test pour valider la connexion Supabase
- `seed-openings.ts` - Script pour peupler la base de données avec les ouvertures
- `migrations/` - Dossier contenant les migrations de schéma SQL

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
```

Vous pouvez trouver ces valeurs dans votre Dashboard Supabase :
- **URL** : Settings → API → Project URL
- **Anon Key** : Settings → API → Project API keys → `anon` `public`

### 2. Création du schéma de base de données

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu de `schema.sql`
4. Exécutez le script SQL

Le script créera :
- Les tables `openings` et `tactical_problems`
- Les indexes pour optimiser les requêtes
- Les policies RLS pour l'accès public en lecture

### 3. Migrations de schéma

Le dossier `migrations/` contient les migrations SQL incrémentales :

- **002_add_insert_policies.sql** - Ajoute les politiques d'insertion RLS
- **003_add_player_side.sql** - Ajoute le champ `player_side` à la table `openings`

Pour appliquer une migration :
1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu de la migration
4. Exécutez le script SQL

**Note**: Les migrations doivent être appliquées dans l'ordre numérique.

## Test de connexion

Pour valider que tout fonctionne correctement, exécutez le script de test :

```bash
npm run test:supabase
```

Ou directement avec tsx :

```bash
npx tsx lib/supabase/test-connection.ts
```

Le script de test vérifie :
- ✅ Les variables d'environnement sont configurées
- ✅ La connexion au client Supabase fonctionne
- ✅ Les tables `openings` et `tactical_problems` existent et sont accessibles
- ✅ Les policies RLS permettent l'accès en lecture publique
- ✅ Les indexes sont fonctionnels

## Utilisation

### Client Browser (Client Components)

```typescript
import { supabase } from "@/lib/supabase/client";

// Exemple : Récupérer toutes les ouvertures
const { data, error } = await supabase
  .from("openings")
  .select("*");
```

### Client Serveur (Server Components, API Routes)

```typescript
import { supabase } from "@/lib/supabase/server";

// Exemple : Récupérer les problèmes tactiques par difficulté
const { data, error } = await supabase
  .from("tactical_problems")
  .select("*")
  .eq("difficulty", "Moyen");
```

## Documentation

Pour plus de détails sur le schéma de base de données, consultez :
- `docs/database-schema.md` - Documentation complète du schéma

