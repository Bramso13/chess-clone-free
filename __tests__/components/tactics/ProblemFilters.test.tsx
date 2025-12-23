/**
 * Tests unitaires pour le composant ProblemFilters
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProblemFilters } from "@/components/tactics/ProblemFilters";
import type { TacticType } from "@/types/chess";

describe("ProblemFilters", () => {
  const mockTacticTypes: TacticType[] = [
    "Fourchette",
    "Clouage",
    "Mat",
  ];

  const defaultProps = {
    selectedDifficulty: "all" as const,
    selectedTacticType: "all" as const,
    availableTacticTypes: mockTacticTypes,
    onDifficultyChange: vi.fn(),
    onTacticTypeChange: vi.fn(),
    onReset: vi.fn(),
  };

  it("devrait afficher les sélecteurs de filtres", () => {
    render(<ProblemFilters {...defaultProps} />);
    
    expect(screen.getByLabelText("Difficulté")).toBeInTheDocument();
    expect(screen.getByLabelText("Type de tactique")).toBeInTheDocument();
  });

  it("devrait afficher le bouton Réinitialiser", () => {
    render(<ProblemFilters {...defaultProps} />);
    expect(screen.getByText("Réinitialiser")).toBeInTheDocument();
  });

  it("devrait appeler onDifficultyChange quand la difficulté change", () => {
    const handleChange = vi.fn();
    render(<ProblemFilters {...defaultProps} onDifficultyChange={handleChange} />);
    
    const select = screen.getByLabelText("Difficulté");
    fireEvent.change(select, { target: { value: "Facile" } });
    
    expect(handleChange).toHaveBeenCalledWith("Facile");
  });

  it("devrait appeler onTacticTypeChange quand le type change", () => {
    const handleChange = vi.fn();
    render(<ProblemFilters {...defaultProps} onTacticTypeChange={handleChange} />);
    
    const select = screen.getByLabelText("Type de tactique");
    fireEvent.change(select, { target: { value: "Fourchette" } });
    
    expect(handleChange).toHaveBeenCalledWith("Fourchette");
  });

  it("devrait appeler onReset quand le bouton est cliqué", () => {
    const handleReset = vi.fn();
    render(<ProblemFilters {...defaultProps} onReset={handleReset} />);
    
    const button = screen.getByText("Réinitialiser");
    fireEvent.click(button);
    
    expect(handleReset).toHaveBeenCalled();
  });

  it("devrait afficher les filtres actifs", () => {
    render(
      <ProblemFilters
        {...defaultProps}
        selectedDifficulty="Moyen"
        selectedTacticType="Clouage"
      />
    );
    
    expect(screen.getByText("Filtres actifs:")).toBeInTheDocument();
    // Vérifier que les badges de filtres actifs sont présents
    const filters = screen.getAllByText("Moyen");
    expect(filters.length).toBeGreaterThan(0);
  });

  it("ne devrait pas afficher les filtres actifs si tous sont à 'all'", () => {
    render(<ProblemFilters {...defaultProps} />);
    expect(screen.queryByText("Filtres actifs:")).not.toBeInTheDocument();
  });

  it("devrait afficher tous les types de tactiques disponibles", () => {
    render(<ProblemFilters {...defaultProps} />);
    
    const select = screen.getByLabelText("Type de tactique");
    mockTacticTypes.forEach((type) => {
      expect(select).toContainHTML(type);
    });
  });
});

