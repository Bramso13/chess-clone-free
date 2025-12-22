/**
 * Tests unitaires pour StockfishGame
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StockfishGame } from "@/components/stockfish/StockfishGame";
import { useRouter } from "next/navigation";

// Mock des hooks et services
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/hooks/useStockfishGame", () => ({
  useStockfishGame: vi.fn(() => ({
    position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: [],
    gameState: "player_turn",
    gameResult: null,
    engineThinkingTime: 0,
    winner: null,
    makePlayerMove: vi.fn(),
    undoMove: vi.fn(),
    newGame: vi.fn(),
    isPlayerTurn: true,
    canUndo: false,
  })),
}));

describe("StockfishGame", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it("affiche l'échiquier", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    // L'échiquier devrait être présent
    expect(document.querySelector(".chessboard")).toBeTruthy();
  });

  it("affiche les informations de partie", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    expect(screen.getByText("Informations")).toBeInTheDocument();
    expect(screen.getByText("intermediate")).toBeInTheDocument();
    expect(screen.getByText("white")).toBeInTheDocument();
  });

  it("affiche l'historique des coups", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    expect(screen.getByText("Historique")).toBeInTheDocument();
  });

  it("affiche le bouton Annuler désactivé au début", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    const undoButton = screen.getByLabelText("Annuler le dernier coup");
    expect(undoButton).toBeDisabled();
  });

  it("affiche le bouton Nouvelle partie", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    expect(screen.getByText("🔄 Nouvelle partie")).toBeInTheDocument();
  });

  it("affiche le bouton Changer la configuration", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    const configButton = screen.getByText("⚙️ Changer la configuration");
    expect(configButton).toBeInTheDocument();
  });

  it("navigue vers la configuration quand on clique sur Changer", () => {
    render(<StockfishGame difficulty="intermediate" playerColor="white" />);

    const configButton = screen.getByText("⚙️ Changer la configuration");
    fireEvent.click(configButton);

    expect(mockPush).toHaveBeenCalledWith("/stockfish");
  });
});

