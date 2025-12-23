/**
 * Composant de feedback de succès pour la résolution de problèmes tactiques
 * Affiche un message de félicitation avec l'explication formatée
 */

"use client";

import { useMemo } from "react";
import type React from "react";
import type { TacticalProblem } from "@/types/chess";

interface SuccessFeedbackProps {
  problem: TacticalProblem;
}

/**
 * Messages de succès variés pour éviter la répétition
 */
const SUCCESS_MESSAGES = [
  "Excellent !",
  "Bravo !",
  "Parfait !",
  "Bien joué !",
  "Tactique maîtrisée !",
  "Superbe !",
  "Impressionnant !",
  "Magnifique !",
  "Formidable !",
];

/**
 * Formate l'explication en préservant les sauts de ligne
 */
function formatExplanation(explanation: string): React.ReactNode {
  // Diviser par les sauts de ligne doubles (paragraphes)
  const paragraphs = explanation.split(/\n\n+/).filter((p) => p.trim());

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => {
        // Vérifier si c'est un titre (ligne courte avec des caractères spéciaux ou en gras)
        const isHeading =
          paragraph.length < 60 &&
          (paragraph.includes("**") || paragraph.includes(":") || paragraph.trim().endsWith("."));

        if (isHeading && paragraph.includes("**")) {
          // Extraire le texte en gras
          const parts = paragraph.split(/(\*\*.*?\*\*)/);
          return (
            <h4 key={index} className="text-lg font-bold text-gray-900">
              {parts.map((part, i) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <span key={i} className="text-blue-700">
                    {part.slice(2, -2)}
                  </span>
                ) : (
                  part
                )
              )}
            </h4>
          );
        }

        if (isHeading) {
          return (
            <h4 key={index} className="text-lg font-bold text-gray-900">
              {paragraph.trim()}
            </h4>
          );
        }

        // Paragraphe normal
        const formattedText = paragraph
          .split(/(\*\*.*?\*\*)/)
          .map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={i} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            ) : (
              part
            )
          );

        return (
          <p key={index} className="text-gray-700 leading-relaxed">
            {formattedText}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Composant SuccessFeedback
 * Affiche le message de succès avec l'explication formatée
 */
export function SuccessFeedback({ problem }: SuccessFeedbackProps) {
  // Sélectionner un message aléatoire
  const successMessage = useMemo(
    () => SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)],
    []
  );

  return (
    <div className="
      bg-gradient-to-r from-green-50 to-emerald-50 
      rounded-lg border-2 border-green-300 p-6 mb-6
      animate-in fade-in slide-in-from-bottom-4 duration-500
    ">
      <div className="flex items-start gap-4">
        {/* Icône de succès */}
        <div className="flex-shrink-0">
          <div className="
            w-12 h-12 rounded-full bg-green-500 
            flex items-center justify-center
            animate-bounce
          ">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-green-900 mb-4">
            {successMessage} Problème résolu !
          </h3>

          {/* Explication formatée */}
          <div className="bg-white/60 rounded-lg p-4 border border-green-200">
            <div className="space-y-3">
              {/* En-tête avec type de tactique */}
              <div className="flex items-center gap-2 pb-2 border-b border-green-200">
                <span className="text-sm font-semibold text-gray-600">Tactique :</span>
                <span className="text-sm font-bold text-blue-700">
                  {problem.tactic_type}
                </span>
              </div>

              {/* Explication */}
              <div className="prose prose-sm max-w-none">
                {formatExplanation(problem.explanation)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

