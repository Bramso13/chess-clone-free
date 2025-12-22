/**
 * Tests pour OpeningTrainer - Player Side
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpeningTrainer } from "@/components/openings/OpeningTrainer";
import type { Opening } from "@/types/chess";

// Mock des dépendances
vi.mock("@/components/chess/Chessboard", () => ({
  Chessboard: ({ boardOrientation, ...props }: any) => (
    <div data-testid="chessboard" data-orientation={boardOrientation} {...props}>
      Mocked Chessboard
    </div>
  ),
}));

vi.mock("@/components/chess/MoveHistory", () => ({
  MoveHistory: () => <div data-testid="move-history">Mocked MoveHistory</div>,
}));

vi.mock("./FeedbackMessage", () => ({
  FeedbackMessage: () => <div data-testid="feedback">Mocked Feedback</div>,
}));

vi.mock("./VariationSelector", () => ({
  VariationSelector: () => <div data-testid="variation-selector">Mocked Selector</div>,
}));

vi.mock("@/lib/hooks/useOpeningTraining", () => ({
  useOpeningTraining: (opening: Opening | null) => ({
    state: {
      opening,
      currentVariation: opening?.variations[0] || null,
      currentVariationIndex: 0,
      game: {} as any,
      position: "start",
      moveHistory: [],
      currentMoveIndex: 0,
      feedback: null,
      isCompleted: false,
      score: { correct: 0, incorrect: 0 },
      isOpponentThinking: false,
      userColor: opening?.player_side || "white",
    },
    actions: {
      makeMove: vi.fn(),
      undoMove: vi.fn(),
      reset: vi.fn(),
      selectVariation: vi.fn(),
    },
  }),
}));

vi.mock("@/lib/validation/moveValidation", () => ({
  calculateProgress: () => 0,
}));

describe("OpeningTrainer - Player Side", () => {
  const whiteOpening: Opening = {
    id: "1",
    name: "Ruy Lopez",
    eco_code: "C70",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    variations: [
      { name: "Main Line", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
    ],
    player_side: "white",
    created_at: "2025-01-27T00:00:00Z",
  };

  const blackOpening: Opening = {
    id: "2",
    name: "Sicilian Defense",
    eco_code: "B50",
    moves: ["e4", "c5"],
    variations: [
      { name: "Main Line", moves: ["e4", "c5", "Nf3", "d6"] },
    ],
    player_side: "black",
    created_at: "2025-01-27T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Board Orientation", () => {
    it("orients board for white when player_side is white", () => {
      render(<OpeningTrainer opening={whiteOpening} />);

      const chessboard = screen.getByTestId("chessboard");
      expect(chessboard).toHaveAttribute("data-orientation", "white");
    });

    it("orients board for black when player_side is black", () => {
      render(<OpeningTrainer opening={blackOpening} />);

      const chessboard = screen.getByTestId("chessboard");
      expect(chessboard).toHaveAttribute("data-orientation", "black");
    });
  });

  describe("Player Side Indicator", () => {
    it('displays "♔ Blancs" for white openings', () => {
      render(<OpeningTrainer opening={whiteOpening} />);
      
      expect(screen.getByText("Vous jouez:")).toBeInTheDocument();
      expect(screen.getByText("♔ Blancs")).toBeInTheDocument();
    });

    it('displays "♚ Noirs" for black openings', () => {
      render(<OpeningTrainer opening={blackOpening} />);
      
      expect(screen.getByText("Vous jouez:")).toBeInTheDocument();
      expect(screen.getByText("♚ Noirs")).toBeInTheDocument();
    });
  });

  describe("Opening Information Display", () => {
    it("displays opening name and ECO code for white opening", () => {
      render(<OpeningTrainer opening={whiteOpening} />);

      expect(screen.getByText("Ruy Lopez")).toBeInTheDocument();
      expect(screen.getByText("C70")).toBeInTheDocument();
    });

    it("displays opening name and ECO code for black opening", () => {
      render(<OpeningTrainer opening={blackOpening} />);

      expect(screen.getByText("Sicilian Defense")).toBeInTheDocument();
      expect(screen.getByText("B50")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("renders all required components for white opening", () => {
      render(<OpeningTrainer opening={whiteOpening} />);

      expect(screen.getByTestId("chessboard")).toBeInTheDocument();
      expect(screen.getByTestId("move-history")).toBeInTheDocument();
      expect(screen.getByTestId("variation-selector")).toBeInTheDocument();
    });

    it("renders all required components for black opening", () => {
      render(<OpeningTrainer opening={blackOpening} />);

      expect(screen.getByTestId("chessboard")).toBeInTheDocument();
      expect(screen.getByTestId("move-history")).toBeInTheDocument();
      expect(screen.getByTestId("variation-selector")).toBeInTheDocument();
    });
  });
});

