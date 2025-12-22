/**
 * Mock de Stockfish pour les tests
 */

export default function Stockfish() {
  return {
    postMessage: () => {},
    onmessage: null,
    terminate: () => {},
  };
}

