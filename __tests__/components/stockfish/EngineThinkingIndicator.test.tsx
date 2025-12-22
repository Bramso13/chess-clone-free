/**
 * Tests unitaires pour EngineThinkingIndicator
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EngineThinkingIndicator } from "@/components/stockfish/EngineThinkingIndicator";

describe("EngineThinkingIndicator", () => {
  it("n'affiche rien quand visible est false", () => {
    const { container } = render(
      <EngineThinkingIndicator thinkingTime={1000} visible={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("affiche l'indicateur quand visible est true", () => {
    render(<EngineThinkingIndicator thinkingTime={1000} visible={true} />);

    expect(screen.getByText("Stockfish réfléchit...")).toBeInTheDocument();
  });

  it("affiche le temps de réflexion en secondes", () => {
    render(<EngineThinkingIndicator thinkingTime={2500} visible={true} />);

    expect(screen.getByText("2.5s")).toBeInTheDocument();
  });

  it("affiche 0.0s au début", () => {
    render(<EngineThinkingIndicator thinkingTime={0} visible={true} />);

    expect(screen.getByText("0.0s")).toBeInTheDocument();
  });

  it("a le rôle status pour l'accessibilité", () => {
    render(<EngineThinkingIndicator thinkingTime={1000} visible={true} />);

    const indicator = screen.getByRole("status");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("aria-live", "polite");
  });
});

