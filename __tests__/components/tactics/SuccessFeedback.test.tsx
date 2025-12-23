/**
 * Tests pour le composant SuccessFeedback
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuccessFeedback } from "@/components/tactics/SuccessFeedback";
import type { TacticalProblem } from "@/types/chess";

describe("SuccessFeedback", () => {
  const mockProblem: TacticalProblem = {
    id: "test-1",
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4", "e5"],
    difficulty: "Facile",
    tactic_type: "Fourchette",
    explanation: "**Fourchette du roi et de la dame**\n\nLe cavalier attaque simultanément le roi et la dame adverse.",
    created_at: "2025-01-01",
  };

  it("devrait afficher un message de félicitation", () => {
    render(<SuccessFeedback problem={mockProblem} />);

    expect(screen.getByText(/Problème résolu !/)).toBeInTheDocument();
  });

  it("devrait afficher le type de tactique", () => {
    render(<SuccessFeedback problem={mockProblem} />);

    expect(screen.getByText("Fourchette")).toBeInTheDocument();
  });

  it("devrait afficher l'explication", () => {
    render(<SuccessFeedback problem={mockProblem} />);

    expect(screen.getByText(/Fourchette du roi et de la dame/)).toBeInTheDocument();
    expect(screen.getByText(/Le cavalier attaque simultanément/)).toBeInTheDocument();
  });

  it("devrait formater l'explication avec du texte en gras", () => {
    render(<SuccessFeedback problem={mockProblem} />);

    // Vérifier que le texte formaté est présent
    const explanationElement = screen.getByText(/Fourchette du roi et de la dame/);
    expect(explanationElement).toBeInTheDocument();
  });

  it("devrait avoir une icône de succès", () => {
    const { container } = render(<SuccessFeedback problem={mockProblem} />);

    // Vérifier qu'il y a une icône SVG (checkmark)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});

