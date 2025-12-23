/**
 * Tests pour le composant SolveFeedback
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SolveFeedback } from "@/components/tactics/SolveFeedback";
import type { TacticalProblem } from "@/types/chess";

describe("SolveFeedback", () => {
  const mockProblem: TacticalProblem = {
    id: "test-1",
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4", "e5", "Nf3"],
    difficulty: "Facile",
    tactic_type: "Fourchette",
    explanation: "Excellent déplacement du cavalier créant une fourchette!",
    created_at: "2025-01-01",
  };

  it("ne devrait rien afficher sans feedback", () => {
    const { container } = render(
      <SolveFeedback feedback={null} isComplete={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("devrait afficher feedback correct", () => {
    render(<SolveFeedback feedback="correct" isComplete={false} />);

    expect(screen.getByText(/Excellent coup/)).toBeInTheDocument();
  });

  it("devrait afficher feedback incorrect", () => {
    render(<SolveFeedback feedback="incorrect" isComplete={false} />);

    expect(screen.getByText(/Ce n'est pas le bon coup/)).toBeInTheDocument();
  });

  it("devrait afficher félicitations quand complet", () => {
    render(
      <SolveFeedback
        feedback={null}
        isComplete={true}
        problem={mockProblem}
      />
    );

    expect(screen.getByText(/Bravo ! Problème résolu !/)).toBeInTheDocument();
    expect(screen.getByText(mockProblem.explanation)).toBeInTheDocument();
  });

  it("devrait appeler onReset quand bouton cliqué", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <SolveFeedback
        feedback={null}
        isComplete={true}
        problem={mockProblem}
        onReset={onReset}
      />
    );

    const resetButton = screen.getByText("Recommencer");
    await user.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

