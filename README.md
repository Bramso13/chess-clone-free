# Chess Clone

Application web de jeu d'échecs développée avec Next.js, TypeScript et Tailwind CSS.

## Prerequisites

Avant de commencer, assurez-vous d'avoir installé les prérequis suivants :

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

Vous pouvez vérifier vos versions avec :

```bash
node --version
npm --version
```

## Setup

1. **Cloner le repository** (si applicable) ou naviguer dans le dossier du projet

2. **Installer les dépendances** :

```bash
npm install
```

3. **Configurer les variables d'environnement** :

Copiez le fichier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Puis éditez `.env.local` et remplissez les valeurs de votre projet Supabase :
- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme de votre projet Supabase

## Development

Démarrer le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir l'application.

La page se met à jour automatiquement lorsque vous modifiez les fichiers.

### Commandes disponibles

- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Compile l'application pour la production
- `npm run start` : Démarre le serveur de production (après `npm run build`)
- `npm run lint` : Exécute ESLint pour vérifier la qualité du code

## Environment Variables

Les variables d'environnement suivantes sont nécessaires :

| Variable | Description | Où l'obtenir |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | Settings > API dans votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme (publique) de votre projet Supabase | Settings > API dans votre projet Supabase |

**Note** : Toutes les variables doivent être préfixées avec `NEXT_PUBLIC_` car elles sont utilisées côté client.

## Project Structure

```
chess-clone-free/
├── app/                    # Routes Next.js App Router
│   ├── layout.tsx         # Layout principal de l'application
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux et Tailwind CSS
├── components/            # Composants React réutilisables
│   ├── chess/            # Composants liés aux échecs
│   └── shared/           # Composants partagés
├── lib/                   # Services et utilitaires
│   ├── chess/            # Services liés aux échecs
│   └── supabase/         # Clients Supabase
├── types/                 # Types TypeScript partagés
├── data/                  # Données statiques et schémas
├── public/                # Assets statiques
└── ...                    # Fichiers de configuration
```

## Technologies

- **Next.js 16+** : Framework React avec App Router
- **TypeScript 5.x** : Typage statique
- **Tailwind CSS 4.x** : Framework CSS utility-first
- **ESLint** : Linter pour la qualité du code
- **Prettier** : Formateur de code

## Learn More

Pour en savoir plus sur Next.js :

- [Documentation Next.js](https://nextjs.org/docs)
- [Apprendre Next.js](https://nextjs.org/learn)

## Deploy

Le moyen le plus simple de déployer votre application Next.js est d'utiliser [Vercel Platform](https://vercel.com/new).

Consultez la [documentation de déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying) pour plus de détails.
