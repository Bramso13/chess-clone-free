/**
 * Tests pour OpeningList
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpeningList } from "@/components/openings/OpeningList";
import type { Opening } from "@/types/chess";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("OpeningList", () => {
  const mockOpenings: Opening[] = [
    {
      id: "1",
      name: "Ruy Lopez",
      eco_code: "C70",
      moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
      variations: [{ name: "Marshall Attack", moves: ["e4", "e5"] }],
      description: "Classic opening",
      player_side: "white",
      created_at: "2025-01-27T00:00:00Z",
    },
    {
      id: "2",
      name: "Sicilian Defense",
      eco_code: "B50",
      moves: ["e4", "c5"],
      variations: [{ name: "Najdorf", moves: ["e4", "c5", "Nf3"] }],
      description: "Popular defense",
      player_side: "black",
      created_at: "2025-01-27T00:00:00Z",
    },
    {
      id: "3",
      name: "French Defense",
      eco_code: "C10",
      moves: ["e4", "e6"],
      variations: [],
      description: "Solid defense",
      player_side: "black",
      created_at: "2025-01-27T00:00:00Z",
    },
  ];

  it("renders list of openings", () => {
    render(<OpeningList openings={mockOpenings} />);

    expect(screen.getByText("Ruy Lopez")).toBeInTheDocument();
    expect(screen.getByText("Sicilian Defense")).toBeInTheDocument();
    expect(screen.getByText("French Defense")).toBeInTheDocument();
  });

  it("renders empty state when no openings provided", () => {
    render(<OpeningList openings={[]} />);

    expect(screen.getByText("Aucune ouverture disponible")).toBeInTheDocument();
    expect(
      screen.getByText("Les ouvertures seront bientôt disponibles.")
    ).toBeInTheDocument();
  });

  it("applies correct grid layout classes", () => {
    const { container } = render(<OpeningList openings={mockOpenings} />);

    const grid = container.querySelector('[role="list"]');
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(grid).toHaveClass("gap-6");
  });

  it("renders correct number of opening cards", () => {
    render(<OpeningList openings={mockOpenings} />);

    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(3);
  });

  it("has accessible list label", () => {
    render(<OpeningList openings={mockOpenings} />);

    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("aria-label", "Liste des ouvertures d'échecs");
  });

  it("renders with single opening", () => {
    render(<OpeningList openings={[mockOpenings[0]]} />);

    expect(screen.getByText("Ruy Lopez")).toBeInTheDocument();
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(1);
  });

  it("each opening card has unique key", () => {
    const { container } = render(<OpeningList openings={mockOpenings} />);

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items).toHaveLength(3);
  });
});

