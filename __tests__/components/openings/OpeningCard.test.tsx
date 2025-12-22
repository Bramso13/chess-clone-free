/**
 * Tests pour OpeningCard
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpeningCard } from "@/components/openings/OpeningCard";
import type { Opening } from "@/types/chess";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("OpeningCard", () => {
  const mockOpening: Opening = {
    id: "1",
    name: "Ruy Lopez",
    eco_code: "C70",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    variations: [
      { name: "Marshall Attack", moves: ["e4", "e5", "Nf3"] },
      { name: "Berlin Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"] },
    ],
    description: "L'une des ouvertures les plus anciennes et classiques",
    player_side: "white",
    created_at: "2025-01-27T00:00:00Z",
  };

  it("renders opening information correctly", () => {
    render(<OpeningCard opening={mockOpening} />);

    expect(screen.getByText("Ruy Lopez")).toBeInTheDocument();
    expect(screen.getByText("C70")).toBeInTheDocument();
    expect(screen.getByText(/L'une des ouvertures les plus anciennes/)).toBeInTheDocument();
  });

  it("displays move count", () => {
    render(<OpeningCard opening={mockOpening} />);

    expect(screen.getByText("5 coups")).toBeInTheDocument();
  });

  it("displays correct variation count for multiple variations", () => {
    render(<OpeningCard opening={mockOpening} />);

    expect(screen.getByText("2 variantes")).toBeInTheDocument();
  });

  it("displays correct variation count for single variation", () => {
    const openingWithOneVariation: Opening = {
      ...mockOpening,
      variations: [{ name: "Main Line", moves: ["e4", "e5"] }],
    };

    render(<OpeningCard opening={openingWithOneVariation} />);

    expect(screen.getByText("1 variante")).toBeInTheDocument();
  });

  it("displays correct text for no variations", () => {
    const openingWithNoVariations: Opening = {
      ...mockOpening,
      variations: [],
    };

    render(<OpeningCard opening={openingWithNoVariations} />);

    expect(screen.getByText("Aucune variante")).toBeInTheDocument();
  });

  it("renders without description", () => {
    const openingWithoutDescription: Opening = {
      ...mockOpening,
      description: undefined,
    };

    render(<OpeningCard opening={openingWithoutDescription} />);

    expect(screen.getByText("Ruy Lopez")).toBeInTheDocument();
    expect(screen.queryByText(/L'une des ouvertures/)).not.toBeInTheDocument();
  });

  it("has correct link to opening detail page", () => {
    render(<OpeningCard opening={mockOpening} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/openings/1");
  });

  it("has accessible label", () => {
    render(<OpeningCard opening={mockOpening} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "Pratiquer l'ouverture Ruy Lopez");
  });

  it("displays action prompt on hover", () => {
    render(<OpeningCard opening={mockOpening} />);

    expect(screen.getByText("Commencer l'entraînement")).toBeInTheDocument();
  });
});

