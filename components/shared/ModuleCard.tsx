/**
 * Composant carte de module pour la page d'accueil
 * Affiche une carte cliquable pour naviguer vers un module d'entraînement
 */

import Link from "next/link";

export interface ModuleCardProps {
  /** Titre du module */
  title: string;
  /** Description courte du module */
  description: string;
  /** Chemin vers le module */
  href: string;
  /** Icône optionnelle */
  icon?: React.ReactNode;
}

/**
 * Carte de module cliquable avec design moderne
 * @param props - Propriétés de la carte
 */
export function ModuleCard({ title, description, href, icon }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
      aria-label={`Accéder au module ${title}`}
    >
      <div className="flex flex-col h-full">
        {icon && (
          <div className="mb-6 text-5xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {title}
        </h2>
        <p className="text-gray-600 leading-relaxed flex-grow">
          {description}
        </p>
        <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
          <span>Commencer</span>
          <svg
            className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

