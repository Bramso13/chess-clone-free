/**
 * Tests pour le hook useTacticsSolver
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTacticsSolver } from "@/lib/hooks/useTacticsSolver";
import type { TacticalProblem } from "@/types/chess";

describe("useTacticsSolver", () => {
  const mockProblem: TacticalProblem = {
    id: "test-1",
    position_fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solution_moves: ["e4", "e5", "Nf3"],
    difficulty: "Facile",
    tactic_type: "Test",
    explanation: "Test problem",
    created_at: "2025-01-01",
  };

  it("devrait initialiser avec la position du problème", () => {
    const { result } = renderHook(() => useTacticsSolver(mockProblem));

    expect(result.current.currentFen).toBe(mockProblem.position_fen);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isPlayerTurn).toBe(true);
    expect(result.current.movesPlayed).toBe(0);
    expect(result.current.totalMoves).toBe(3);
  });

  it("devrait accepter un coup correct", () => {
    const { result } = renderHook(() => useTacticsSolver(mockProblem));

    act(() => {
      result.current.handleMove("e4");
    });

    expect(result.current.feedback).toBe("correct");
    expect(result.current.movesPlayed).toBe(1);
  });

  it("devrait rejeter un coup incorrect", () => {
    const { result } = renderHook(() => useTacticsSolver(mockProblem));

    act(() => {
      result.current.handleMove("d4"); // Mauvais coup
    });

    expect(result.current.feedback).toBe("incorrect");
    expect(result.current.movesPlayed).toBe(0);
  });

  it("devrait permettre de réinitialiser", () => {
    const { result } = renderHook(() => useTacticsSolver(mockProblem));

    // Jouer un coup
    act(() => {
      result.current.handleMove("e4");
    });

    expect(result.current.movesPlayed).toBe(1);

    // Réinitialiser
    act(() => {
      result.current.reset();
    });

    expect(result.current.movesPlayed).toBe(0);
    expect(result.current.currentFen).toBe(mockProblem.position_fen);
    expect(result.current.isComplete).toBe(false);
  });

  it("devrait gérer les mouvements objets", () => {
    const { result } = renderHook(() => useTacticsSolver(mockProblem));

    act(() => {
      result.current.handleMove({ from: "e2", to: "e4" });
    });

    expect(result.current.feedback).toBe("correct");
  });
});

