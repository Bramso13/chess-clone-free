/**
 * Module Stockfish - Page de jeu
 * Interface de jeu contre Stockfish
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StockfishGame } from "@/components/stockfish/StockfishGame";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { DifficultyLevel } from "@/types/chess";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const difficultyParam = searchParams.get("difficulty");
  const colorParam = searchParams.get("color");

  useEffect(() => {
    // Valider les paramètres
    if (!difficultyParam || !colorParam) {
      router.push("/stockfish");
      return;
    }

    // Valider la couleur
    if (colorParam !== "white" && colorParam !== "black" && colorParam !== "random") {
      router.push("/stockfish");
      return;
    }

    setIsLoading(false);
  }, [difficultyParam, colorParam, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Déterminer la couleur finale (gérer le cas "random")
  const finalColor =
    colorParam === "random"
      ? Math.random() < 0.5
        ? "white"
        : "black"
      : (colorParam as "white" | "black");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🤖 Partie contre Stockfish
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StockfishGame
          difficulty={difficultyParam as DifficultyLevel}
          playerColor={finalColor}
        />
      </main>
    </div>
  );
}

export default function StockfishGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}

