/**
 * Tests pour le composant ProblemActions
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProblemActions } from "@/components/tactics/ProblemActions";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("ProblemActions", () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    mockOnReset.mockClear();
  });

  it("devrait afficher tous les boutons", () => {
    render(
      <ProblemActions
        currentProblemId="2"
        previousProblemId="1"
        nextProblemId="3"
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText("Précédent")).toBeInTheDocument();
    expect(screen.getByText("Recommencer")).toBeInTheDocument();
    expect(screen.getByText("Liste des problèmes")).toBeInTheDocument();
    expect(screen.getByText("Suivant")).toBeInTheDocument();
  });

  it("devrait désactiver le bouton précédent si pas de problème précédent", () => {
    render(
      <ProblemActions
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
        onReset={mockOnReset}
      />
    );

    const prevButton = screen.getByText("Précédent").closest("button");
    expect(prevButton).toBeDisabled();
  });

  it("devrait désactiver le bouton suivant si pas de problème suivant", () => {
    render(
      <ProblemActions
        currentProblemId="10"
        previousProblemId="9"
        nextProblemId={null}
        onReset={mockOnReset}
      />
    );

    const nextButton = screen.getByText("Suivant").closest("button");
    expect(nextButton).toBeDisabled();
  });

  it("devrait appeler onReset quand Recommencer est cliqué", async () => {
    const user = userEvent.setup();
    render(
      <ProblemActions
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
        onReset={mockOnReset}
      />
    );

    const resetButton = screen.getByText("Recommencer");
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it("devrait avoir un lien vers la liste des problèmes", () => {
    render(
      <ProblemActions
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
        onReset={mockOnReset}
      />
    );

    const listLink = screen.getByText("Liste des problèmes").closest("a");
    expect(listLink).toHaveAttribute("href", "/tactics");
  });

  it("devrait afficher le bouton Revoir la solution si fourni", () => {
    const mockOnReplay = vi.fn();
    render(
      <ProblemActions
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
        onReset={mockOnReset}
        onReplaySolution={mockOnReplay}
      />
    );

    expect(screen.getByText("Revoir la solution")).toBeInTheDocument();
  });

  it("ne devrait pas afficher Revoir la solution si non fourni", () => {
    render(
      <ProblemActions
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
        onReset={mockOnReset}
      />
    );

    expect(screen.queryByText("Revoir la solution")).not.toBeInTheDocument();
  });
});

