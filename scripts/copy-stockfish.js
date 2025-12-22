/**
 * Script pour copier Stockfish dans le dossier public
 * À exécuter après npm install
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'stockfish', 'src');
const targetDir = path.join(__dirname, '..', 'public');

// Fichiers à copier (version lite-single pour compatibilité sans CORS headers)
// La version single-threaded ne nécessite pas SharedArrayBuffer
const files = [
  {
    source: 'stockfish-17.1-lite-single-03e3232.js',
    target: 'stockfish.js'
  },
  {
    source: 'stockfish-17.1-lite-single-03e3232.wasm',
    target: 'stockfish.wasm'
  }
];

console.log('📦 Copie de Stockfish dans le dossier public...');

files.forEach(({ source, target }) => {
  const sourcePath = path.join(sourceDir, source);
  const targetPath = path.join(targetDir, target);

  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ ${source} → ${target}`);
    } else {
      console.warn(`⚠️  ${source} non trouvé`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la copie de ${source}:`, error.message);
  }
});

console.log('✨ Stockfish copié avec succès !');

