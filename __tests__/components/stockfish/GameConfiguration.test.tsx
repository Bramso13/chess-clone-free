/**
 * Tests unitaires pour GameConfiguration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameConfiguration } from "@/components/stockfish/GameConfiguration";
import { useRouter } from "next/navigation";

// Mock du router Next.js
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("GameConfiguration", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  describe("Rendering", () => {
    it("affiche tous les niveaux de difficulté", () => {
      render(<GameConfiguration />);

      expect(screen.getByText("Débutant")).toBeInTheDocument();
      expect(screen.getByText("Intermédiaire")).toBeInTheDocument();
      expect(screen.getByText("Avancé")).toBeInTheDocument();
      expect(screen.getByText("Expert")).toBeInTheDocument();
      expect(screen.getByText("Maître")).toBeInTheDocument();
    });

    it("affiche les options de couleur", () => {
      render(<GameConfiguration />);

      expect(screen.getByText("Blancs")).toBeInTheDocument();
      expect(screen.getByText("Noirs")).toBeInTheDocument();
      expect(screen.getByText("Aléatoire")).toBeInTheDocument();
    });

    it("affiche le bouton Commencer la partie", () => {
      render(<GameConfiguration />);

      expect(screen.getByText("Commencer la partie")).toBeInTheDocument();
    });

    it("affiche le lien de retour à l'accueil", () => {
      render(<GameConfiguration />);

      expect(screen.getByText("← Retour à l'accueil")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("sélectionne un niveau de difficulté", () => {
      render(<GameConfiguration />);

      const intermediateButton = screen.getByText("Intermédiaire");
      fireEvent.click(intermediateButton);

      // Vérifier que le bouton est marqué comme sélectionné
      expect(intermediateButton.closest("button")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    it("sélectionne une couleur", () => {
      render(<GameConfiguration />);

      const whiteButton = screen.getByLabelText("Jouer avec les Blancs");
      fireEvent.click(whiteButton);

      expect(whiteButton).toHaveAttribute("aria-pressed", "true");
    });

    it("désactive le bouton Commencer si la configuration est incomplète", () => {
      render(<GameConfiguration />);

      const startButton = screen.getByText("Commencer la partie");
      expect(startButton).toBeDisabled();
    });

    it("active le bouton Commencer quand tous les champs sont remplis", () => {
      render(<GameConfiguration />);

      // Sélectionner difficulté
      fireEvent.click(screen.getByText("Intermédiaire"));

      // Sélectionner couleur
      fireEvent.click(screen.getByLabelText("Jouer avec les Blancs"));

      const startButton = screen.getByText("Commencer la partie");
      expect(startButton).not.toBeDisabled();
    });
  });

  describe("Validation", () => {
    it("désactive le bouton Commencer si seule la couleur est sélectionnée", () => {
      render(<GameConfiguration />);

      // Sélectionner seulement la couleur
      fireEvent.click(screen.getByLabelText("Jouer avec les Blancs"));

      // Le bouton devrait rester désactivé
      const startButton = screen.getByText("Commencer la partie");
      expect(startButton).toBeDisabled();
    });

    it("désactive le bouton Commencer si seule la difficulté est sélectionnée", () => {
      render(<GameConfiguration />);

      // Sélectionner seulement la difficulté
      fireEvent.click(screen.getByText("Intermédiaire"));

      // Le bouton devrait rester désactivé
      const startButton = screen.getByText("Commencer la partie");
      expect(startButton).toBeDisabled();
    });

    it("n'affiche pas d'erreur au chargement initial", () => {
      render(<GameConfiguration />);

      // Aucune erreur ne devrait être visible
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigue vers la page de jeu avec les bons paramètres", () => {
      render(<GameConfiguration />);

      // Configurer la partie
      fireEvent.click(screen.getByText("Intermédiaire"));
      fireEvent.click(screen.getByLabelText("Jouer avec les Blancs"));

      // Commencer la partie
      fireEvent.click(screen.getByText("Commencer la partie"));

      expect(mockPush).toHaveBeenCalledWith(
        "/stockfish/game?difficulty=intermediate&color=white"
      );
    });

    it("retourne à l'accueil quand on clique sur Retour", () => {
      render(<GameConfiguration />);

      fireEvent.click(screen.getByText("← Retour à l'accueil"));

      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});

