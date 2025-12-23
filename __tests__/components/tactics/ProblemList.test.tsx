/**
 * Tests unitaires pour le composant ProblemList
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProblemList } from "@/components/tactics/ProblemList";
import type { TacticalProblem } from "@/types/chess";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("ProblemList", () => {
  const mockProblems: TacticalProblem[] = [
    {
      id: "1",
      position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      solution_moves: ["e4", "e5"],
      difficulty: "Facile",
      tactic_type: "Fourchette",
      explanation: "Test 1",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "2",
      position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      solution_moves: ["d4", "d5", "e4"],
      difficulty: "Moyen",
      tactic_type: "Clouage",
      explanation: "Test 2",
      created_at: "2025-01-02T00:00:00Z",
    },
  ];

  it("devrait afficher le compteur de problèmes", () => {
    render(<ProblemList problems={mockProblems} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/problèmes trouvés/i)).toBeInTheDocument();
  });

  it("devrait afficher toutes les cartes de problèmes", () => {
    render(<ProblemList problems={mockProblems} />);
    expect(screen.getByText("Fourchette")).toBeInTheDocument();
    expect(screen.getByText("Clouage")).toBeInTheDocument();
  });

  it("devrait afficher un message quand aucun problème", () => {
    render(<ProblemList problems={[]} />);
    expect(screen.getByText(/Aucun problème trouvé/i)).toBeInTheDocument();
  });

  it("devrait afficher des placeholders pendant le chargement", () => {
    render(<ProblemList problems={[]} isLoading={true} />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("devrait utiliser le singulier pour 1 problème", () => {
    const singleProblem = [mockProblems[0]];
    render(<ProblemList problems={singleProblem} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/problème trouvé/i)).toBeInTheDocument();
  });
});

