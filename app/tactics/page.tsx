/**
 * Module Tactiques - Page placeholder
 * Cette page sera implémentée dans les stories futures
 */

import Link from "next/link";

export default function TacticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 Module Tactiques
            </h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
              aria-label="Retour à l'accueil"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Retour</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <div className="text-center">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Module en cours de développement
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Le module d'entraînement aux tactiques sera bientôt disponible.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Fonctionnalités prévues :
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Résolution de problèmes tactiques variés (fourchettes, clouages, enfilades, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Difficulté progressive adaptée à votre niveau</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Statistiques de progression et performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Explications détaillées des solutions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

