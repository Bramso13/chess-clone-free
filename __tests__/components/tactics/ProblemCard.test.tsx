/**
 * Tests unitaires pour le composant ProblemCard
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProblemCard } from "@/components/tactics/ProblemCard";
import type { TacticalProblem } from "@/types/chess";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("ProblemCard", () => {
  const mockProblem: TacticalProblem = {
    id: "test-id-1",
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4", "e5"],
    difficulty: "Facile",
    tactic_type: "Fourchette",
    explanation: "Ceci est une explication de test pour le problème tactique.",
    created_at: "2025-01-01T00:00:00Z",
  };

  it("devrait afficher la difficulté du problème", () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText("Facile")).toBeInTheDocument();
  });

  it("devrait afficher le type de tactique", () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText("Fourchette")).toBeInTheDocument();
  });

  it("devrait afficher le nombre de coups", () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText("2 coups")).toBeInTheDocument();
  });

  it("devrait afficher 1 coup au singulier", () => {
    const singleMoveProblem = {
      ...mockProblem,
      solution_moves: ["e4"],
    };
    render(<ProblemCard problem={singleMoveProblem} />);
    expect(screen.getByText("1 coup")).toBeInTheDocument();
  });

  it("devrait afficher l'explication (tronquée)", () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText(mockProblem.explanation)).toBeInTheDocument();
  });

  it("devrait avoir un data-testid", () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByTestId("problem-card")).toBeInTheDocument();
  });

  it("devrait utiliser les bonnes couleurs pour difficulté Facile", () => {
    render(<ProblemCard problem={mockProblem} />);
    const badge = screen.getByText("Facile");
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("devrait utiliser les bonnes couleurs pour difficulté Moyen", () => {
    const mediumProblem = { ...mockProblem, difficulty: "Moyen" as const };
    render(<ProblemCard problem={mediumProblem} />);
    const badge = screen.getByText("Moyen");
    expect(badge.className).toContain("bg-yellow-100");
    expect(badge.className).toContain("text-yellow-800");
  });

  it("devrait utiliser les bonnes couleurs pour difficulté Difficile", () => {
    const hardProblem = { ...mockProblem, difficulty: "Difficile" as const };
    render(<ProblemCard problem={hardProblem} />);
    const badge = screen.getByText("Difficile");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
  });
});

