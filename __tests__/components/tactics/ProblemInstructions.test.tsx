/**
 * Tests pour le composant ProblemInstructions
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProblemInstructions } from "@/components/tactics/ProblemInstructions";
import type { TacticalProblem } from "@/types/chess";

describe("ProblemInstructions", () => {
  const mockProblem: TacticalProblem = {
    id: "test-1",
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4", "e5", "Nf3"],
    difficulty: "Facile",
    tactic_type: "Fourchette",
    explanation: "Test problem",
    created_at: "2025-01-01",
  };

  it("devrait afficher qui joue (Blancs)", () => {
    render(<ProblemInstructions problem={mockProblem} />);

    expect(screen.getByText(/Les Blancs jouent et gagnent/)).toBeInTheDocument();
  });

  it("devrait afficher qui joue (Noirs)", () => {
    const blackProblem = {
      ...mockProblem,
      position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1",
    };

    render(<ProblemInstructions problem={blackProblem} />);

    expect(screen.getByText(/Les Noirs jouent et gagnent/)).toBeInTheDocument();
  });

  it("devrait afficher la difficulté", () => {
    render(<ProblemInstructions problem={mockProblem} />);

    expect(screen.getByText("Facile")).toBeInTheDocument();
  });

  it("devrait afficher le type de tactique", () => {
    render(<ProblemInstructions problem={mockProblem} />);

    expect(screen.getByText("Fourchette")).toBeInTheDocument();
  });

  it("devrait afficher la progression quand fournie", () => {
    render(
      <ProblemInstructions problem={mockProblem} movesPlayed={2} totalMoves={5} />
    );

    expect(screen.getByText("2 / 5 coups")).toBeInTheDocument();
  });

  it("devrait afficher les instructions", () => {
    render(<ProblemInstructions problem={mockProblem} />);

    expect(
      screen.getByText(/Cliquez sur une pièce puis sur la case de destination/)
    ).toBeInTheDocument();
  });
});

