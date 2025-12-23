/**
 * Tests pour le composant ProblemNavigation
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProblemNavigation } from "@/components/tactics/ProblemNavigation";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("ProblemNavigation", () => {
  it("devrait afficher tous les boutons", () => {
    render(
      <ProblemNavigation
        currentProblemId="2"
        previousProblemId="1"
        nextProblemId="3"
      />
    );

    expect(screen.getByText("Précédent")).toBeInTheDocument();
    expect(screen.getByText("Liste des problèmes")).toBeInTheDocument();
    expect(screen.getByText("Suivant")).toBeInTheDocument();
  });

  it("devrait désactiver le bouton précédent quand pas de problème précédent", () => {
    render(
      <ProblemNavigation
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
      />
    );

    const prevButton = screen.getByText("Précédent").closest("button");
    expect(prevButton).toBeDisabled();
  });

  it("devrait désactiver le bouton suivant quand pas de problème suivant", () => {
    render(
      <ProblemNavigation
        currentProblemId="10"
        previousProblemId="9"
        nextProblemId={null}
      />
    );

    const nextButton = screen.getByText("Suivant").closest("button");
    expect(nextButton).toBeDisabled();
  });

  it("devrait avoir un lien vers la liste", () => {
    render(
      <ProblemNavigation
        currentProblemId="1"
        previousProblemId={null}
        nextProblemId="2"
      />
    );

    const listLink = screen.getByText("Liste des problèmes").closest("a");
    expect(listLink).toHaveAttribute("href", "/tactics");
  });
});

