import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VariationSelector } from "@/components/openings/VariationSelector";
import type { OpeningVariation } from "@/types/chess";

describe("VariationSelector", () => {
  const mockVariations: OpeningVariation[] = [
    { name: "Ligne Principale", moves: ["e4", "e5", "Nf3", "Nc6"] },
    { name: "Variante d'Échange", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6"] },
    { name: "Défense de Berlin", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"] },
  ];

  const onSelectVariation = vi.fn();

  beforeEach(() => {
    onSelectVariation.mockClear();
  });

  it("renders all variations on desktop view", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={0}
        onSelectVariation={onSelectVariation}
      />
    );

    // Desktop tabs should be present (using getAllByText since text appears in multiple places)
    const mainLineElements = screen.getAllByText("Ligne Principale");
    expect(mainLineElements.length).toBeGreaterThan(0);
    
    const exchangeElements = screen.getAllByText("Variante d'Échange");
    expect(exchangeElements.length).toBeGreaterThan(0);
    
    const berlinElements = screen.getAllByText("Défense de Berlin");
    expect(berlinElements.length).toBeGreaterThan(0);
    
    // Verify buttons exist
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("highlights currently selected variation", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={1}
        onSelectVariation={onSelectVariation}
      />
    );

    const exchangeButtons = screen.getAllByText("Variante d'Échange");
    // Desktop button should have the active class
    const desktopButton = exchangeButtons[0];
    expect(desktopButton).toHaveClass("bg-blue-600");
  });

  it("calls onSelectVariation when variation clicked", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={0}
        onSelectVariation={onSelectVariation}
      />
    );

    const berlinButtons = screen.getAllByText("Défense de Berlin");
    fireEvent.click(berlinButtons[0]);
    expect(onSelectVariation).toHaveBeenCalledWith(2);
  });

  it("displays current variation info", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={0}
        onSelectVariation={onSelectVariation}
      />
    );

    // Should show the current variation name and move count
    expect(screen.getByText(/4 coups/)).toBeInTheDocument();
  });

  it("renders dropdown on mobile with correct selected value", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={1}
        onSelectVariation={onSelectVariation}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("1");
  });

  it("calls onSelectVariation when dropdown selection changes", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={0}
        onSelectVariation={onSelectVariation}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2" } });
    expect(onSelectVariation).toHaveBeenCalledWith(2);
  });

  it("handles empty variations list gracefully", () => {
    const { container } = render(
      <VariationSelector
        variations={[]}
        currentVariationIndex={0}
        onSelectVariation={onSelectVariation}
      />
    );

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it("shows simplified view for single variation", () => {
    render(
      <VariationSelector
        variations={[mockVariations[0]]}
        currentVariationIndex={0}
        onSelectVariation={onSelectVariation}
      />
    );

    // Should show simple text display, not buttons/dropdown
    expect(screen.getByText("Variante:")).toBeInTheDocument();
    expect(screen.getByText("Ligne Principale")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("sets aria-current on active variation button", () => {
    render(
      <VariationSelector
        variations={mockVariations}
        currentVariationIndex={1}
        onSelectVariation={onSelectVariation}
      />
    );

    const buttons = screen.getAllByRole("button");
    const exchangeButton = buttons.find(b => b.textContent === "Variante d'Échange");
    expect(exchangeButton).toHaveAttribute("aria-current", "page");
  });
});

