# Scripts de Build

## copy-stockfish.js

### Problème résolu

Le package npm `stockfish` a un problème de configuration :
- Son `package.json` pointe vers `src/stockfish.js` qui n'existe pas
- Cela empêche l'import dynamique standard `import("stockfish")`
- L'erreur : "Failed to resolve entry for package 'stockfish'"

### Solution

Ce script copie automatiquement les fichiers Stockfish depuis `node_modules` vers le dossier `public/`, permettant un chargement direct via Web Worker.

**Fichiers copiés :**
- `stockfish-17.1-lite-single-03e3232.js` → `public/stockfish.js` (20 KB)
- `stockfish-17.1-lite-single-03e3232.wasm` → `public/stockfish.wasm` (7 MB)

**Pourquoi la version "lite-single" ?**
- **Single-threaded** : Pas besoin de SharedArrayBuffer (évite les problèmes de CORS headers)
- **Lite** : Plus rapide à charger que la version complète
- **Suffisant** : Assez fort pour tous les niveaux de difficulté
- **Compatible** : Fonctionne sans configuration serveur spéciale

Note : La version multi-threaded nécessiterait ces headers HTTP :
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

### Utilisation

Le script s'exécute automatiquement après `npm install` grâce au hook `postinstall` dans `package.json`.

**Exécution manuelle :**
```bash
node scripts/copy-stockfish.js
```

### Configuration Git

Les fichiers générés sont ignorés par Git (voir `.gitignore`) car ils sont recréés automatiquement lors de l'installation.

### Alternative explorées

1. ✗ Import dynamique direct : Ne fonctionne pas (point d'entrée invalide)
2. ✗ Résolution webpack custom : Trop complexe et fragile
3. ✓ **Copie dans public/** : Simple, fiable, performant
4. Alternative : Utiliser un CDN externe (non choisi pour des raisons de performance et disponibilité offline)

### Maintenance

Si la version de Stockfish change :
1. Mettre à jour les noms de fichiers dans `copy-stockfish.js`
2. Relancer `npm install` ou le script manuellement
3. Tester le chargement du moteur

