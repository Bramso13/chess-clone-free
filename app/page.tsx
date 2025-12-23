/**
 * Page d'accueil de l'application Chess Training
 * Affiche trois cartes pour naviguer vers les modules d'entraînement
 */

import { ModuleCard } from "@/components/shared/ModuleCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900 text-center">
            ♟️ Chess Training
          </h1>
          <p className="text-gray-600 text-center mt-2 text-lg">
            Améliorez votre jeu d'échecs avec nos modules d'entraînement
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choisissez votre module d'entraînement
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Que vous souhaitiez maîtriser les ouvertures, affronter une IA
            puissante ou résoudre des problèmes tactiques, nous avons ce qu'il
            vous faut.
          </p>
        </div>

        {/* Module Cards Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          role="navigation"
          aria-label="Modules d'entraînement"
        >
          {/* Module Ouvertures */}
          <ModuleCard
            title="Ouvertures"
            description="Apprenez et pratiquez les ouvertures classiques. Maîtrisez les premiers coups et comprenez les idées stratégiques derrière chaque ouverture."
            href="/openings"
            icon="📚"
          />

          {/* Module Stockfish */}
          <ModuleCard
            title="Jouer contre l'IA"
            description="Affrontez Stockfish, l'un des moteurs d'échecs les plus puissants au monde. Ajustez le niveau de difficulté selon vos besoins."
            href="/stockfish"
            icon="🤖"
          />

          {/* Module Tactiques */}
          <ModuleCard
            title="Tactiques"
            description="Résolvez des problèmes tactiques pour améliorer votre vision du jeu. Entraînez-vous aux combinaisons, fourchettes, clouages et plus encore."
            href="/tactics"
            icon="🎯"
          />

          {/* Module Génération de tactiques */}
          <ModuleCard
            title="Générer des tactiques"
            description="Générez automatiquement de nouveaux problèmes tactiques à partir de parties réelles. Créez votre propre collection de positions d'entraînement."
            href="/tactics/generate"
            icon="✨"
          />

          {/* Module Jeu libre */}
          <ModuleCard
            title="Jeu libre"
            description="Explorez librement différentes positions d'échecs. Jouez des coups pour les blancs ou les noirs, annulez vos coups et demandez des suggestions à Stockfish."
            href="/free-play"
            icon="🎮"
          />
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Plateforme d'entraînement aux échecs • Version MVP
          </p>
        </div>
      </main>
    </div>
  );
}
