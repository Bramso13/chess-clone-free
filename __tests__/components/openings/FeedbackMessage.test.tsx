/**
 * Tests pour FeedbackMessage
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackMessage } from "@/components/openings/FeedbackMessage";
import type { MoveValidationResult } from "@/lib/validation/moveValidation";

describe("FeedbackMessage", () => {
  it("should render nothing when validation is null", () => {
    const { container } = render(<FeedbackMessage validation={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render positive feedback for correct move", () => {
    const validation: MoveValidationResult = {
      valid: true,
      message: "✓ Coup correct !",
      completed: false,
    };

    render(<FeedbackMessage validation={validation} />);

    expect(screen.getByText(/Coup correct/)).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("should render negative feedback for incorrect move", () => {
    const validation: MoveValidationResult = {
      valid: false,
      message: "✗ Coup incorrect",
      completed: false,
      expectedMove: "e4",
    };

    render(<FeedbackMessage validation={validation} />);

    expect(screen.getByText(/Coup incorrect/)).toBeInTheDocument();
    expect(screen.getByText("✗")).toBeInTheDocument();
    expect(screen.getByText(/e4/)).toBeInTheDocument();
  });

  it("should show undo button for incorrect move", () => {
    const onUndo = vi.fn();
    const validation: MoveValidationResult = {
      valid: false,
      message: "✗ Coup incorrect",
      completed: false,
      expectedMove: "e4",
    };

    render(<FeedbackMessage validation={validation} onUndo={onUndo} />);

    const undoButton = screen.getByRole("button", { name: /Annuler/i });
    expect(undoButton).toBeInTheDocument();

    fireEvent.click(undoButton);
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("should not show undo button for correct move", () => {
    const onUndo = vi.fn();
    const validation: MoveValidationResult = {
      valid: true,
      message: "✓ Coup correct !",
      completed: false,
    };

    render(<FeedbackMessage validation={validation} onUndo={onUndo} />);

    expect(screen.queryByRole("button", { name: /Annuler/i })).not.toBeInTheDocument();
  });

  it("should show completion message for completed opening", () => {
    const validation: MoveValidationResult = {
      valid: true,
      message: "🎉 Félicitations !",
      completed: true,
    };

    render(<FeedbackMessage validation={validation} />);

    expect(screen.getByText(/Ligne d'ouverture complétée/)).toBeInTheDocument();
  });

  it("should not show undo button when completed", () => {
    const onUndo = vi.fn();
    const validation: MoveValidationResult = {
      valid: false,
      message: "Already completed",
      completed: true,
    };

    render(<FeedbackMessage validation={validation} onUndo={onUndo} />);

    expect(screen.queryByRole("button", { name: /Annuler/i })).not.toBeInTheDocument();
  });
});

