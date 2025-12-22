/**
 * Tests pour MoveHistory
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoveHistory } from "@/components/chess/MoveHistory";

describe("MoveHistory", () => {
  it("should render empty state when no moves", () => {
    render(<MoveHistory moves={[]} />);

    expect(screen.getByText("Historique")).toBeInTheDocument();
    expect(screen.getByText("Aucun coup joué")).toBeInTheDocument();
  });

  it("should render move history with correct moves", () => {
    const moves = [
      { move: "e4", valid: true, fen: "fen1" },
      { move: "e5", valid: true, fen: "fen2" },
    ];

    render(<MoveHistory moves={moves} />);

    expect(screen.getByText("e4")).toBeInTheDocument();
    expect(screen.getByText("e5")).toBeInTheDocument();
    expect(screen.getAllByText("✓")).toHaveLength(2);
  });

  it("should render move history with incorrect moves", () => {
    const moves = [
      { move: "e4", valid: true, fen: "fen1" },
      { move: "d4", valid: false, fen: "fen2" },
    ];

    render(<MoveHistory moves={moves} />);

    expect(screen.getByText("e4")).toBeInTheDocument();
    expect(screen.getByText("d4")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("✗")).toBeInTheDocument();
  });

  it("should render move numbers correctly", () => {
    const moves = [
      { move: "e4", valid: true, fen: "fen1" },
      { move: "e5", valid: true, fen: "fen2" },
      { move: "Nf3", valid: true, fen: "fen3" },
      { move: "Nc6", valid: true, fen: "fen4" },
    ];

    render(<MoveHistory moves={moves} />);

    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
  });

  it("should use custom title when provided", () => {
    render(<MoveHistory moves={[]} title="Mes Coups" />);

    expect(screen.getByText("Mes Coups")).toBeInTheDocument();
    expect(screen.queryByText("Historique")).not.toBeInTheDocument();
  });

  it("should render single move correctly", () => {
    const moves = [{ move: "e4", valid: true, fen: "fen1" }];

    render(<MoveHistory moves={moves} />);

    expect(screen.getByText("e4")).toBeInTheDocument();
    expect(screen.getByText("1.")).toBeInTheDocument();
  });
});

