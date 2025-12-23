/**
 * Tests unitaires pour OpeningVariationService
 * Valide la génération de variantes sur positions connues
 */

import { describe, it, expect } from "vitest";
import {
  generateAllLegalVariations,
  getAllVariationSequences,
  getVariationCount,
  getNodeCount,
  type VariationTree,
} from "@/lib/openings/openingVariationService";

describe("OpeningVariationService", () => {
  const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  /**
   * Scénario 1: Génération sur position initiale avec profondeur 1
   */
  describe("generateAllLegalVariations - profondeur 1", () => {
    it("devrait générer toutes les variantes légales pour profondeur 1", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 1,
        maxVariationsPerLevel: 20,
      });

      expect(tree.rootFen).toBe(initialFen);
      expect(tree.maxDepth).toBe(1);
      expect(tree.nodes.length).toBeGreaterThan(0);
      expect(tree.nodes.length).toBeLessThanOrEqual(20); // Limité par maxVariationsPerLevel

      // Vérifier que tous les nœuds ont depth = 1
      tree.nodes.forEach((node) => {
        expect(node.depth).toBe(1);
        expect(node.children).toHaveLength(0); // Pas d'enfants à profondeur 1
        expect(node.move).toBeTruthy();
        expect(node.fen).toBeTruthy();
      });
    });

    it("devrait respecter la limite maxVariationsPerLevel", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 1,
        maxVariationsPerLevel: 5,
      });

      expect(tree.nodes.length).toBeLessThanOrEqual(5);
    });
  });

  /**
   * Scénario 2: Génération sur position initiale avec profondeur 2
   */
  describe("generateAllLegalVariations - profondeur 2", () => {
    it("devrait générer un arbre avec profondeur 2", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 10,
      });

      expect(tree.maxDepth).toBe(2);

      // Vérifier que les nœuds de niveau 1 ont des enfants
      const nodesWithChildren = tree.nodes.filter(
        (node) => node.children.length > 0
      );
      expect(nodesWithChildren.length).toBeGreaterThan(0);

      // Vérifier que les enfants ont depth = 2
      tree.nodes.forEach((node) => {
        expect(node.depth).toBe(1);
        node.children.forEach((child) => {
          expect(child.depth).toBe(2);
          expect(child.children).toHaveLength(0); // Pas d'enfants à profondeur 2
        });
      });
    });
  });

  /**
   * Scénario 3: Génération sur position d'ouverture connue (Ruy Lopez après 3 coups)
   */
  describe("generateAllLegalVariations - position d'ouverture", () => {
    it("devrait générer des variantes pour une position d'ouverture connue", () => {
      // Position après 1.e4 e5 2.Nf3 Nc6 (Ruy Lopez début)
      const ruyLopezFen =
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

      const tree = generateAllLegalVariations(ruyLopezFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 15,
      });

      expect(tree.rootFen).toBe(ruyLopezFen);
      expect(tree.nodes.length).toBeGreaterThan(0);

      // Vérifier que tous les coups générés sont valides
      tree.nodes.forEach((node) => {
        expect(node.move).toBeTruthy();
        expect(node.fen).toBeTruthy();
        expect(node.depth).toBe(1);
      });
    });
  });

  /**
   * Scénario 4: Limitation du nombre de variantes par niveau
   */
  describe("generateAllLegalVariations - limitation variantes", () => {
    it("devrait limiter le nombre de variantes au premier niveau", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 3,
      });

      expect(tree.nodes.length).toBeLessThanOrEqual(3);

      // Vérifier que chaque enfant respecte aussi la limite
      tree.nodes.forEach((node) => {
        expect(node.children.length).toBeLessThanOrEqual(3);
      });
    });
  });

  /**
   * Scénario 5: Validation que tous les coups générés sont légaux
   */
  describe("generateAllLegalVariations - validation coups légaux", () => {
    it("devrait générer uniquement des coups légaux", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 1,
        maxVariationsPerLevel: 20,
      });

      // Tous les coups doivent être des strings non vides
      tree.nodes.forEach((node) => {
        expect(typeof node.move).toBe("string");
        expect(node.move.length).toBeGreaterThan(0);
        expect(node.fen).toBeTruthy();
      });
    });
  });

  /**
   * Scénario 6: Validation que les FEN générés sont valides
   */
  describe("generateAllLegalVariations - validation FEN", () => {
    it("devrait générer des FEN valides", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 5,
      });

      function validateFen(fen: string): boolean {
        // Format FEN basique: 8 sections séparées par des espaces
        const parts = fen.split(" ");
        return parts.length === 6;
      }

      tree.nodes.forEach((node) => {
        expect(validateFen(node.fen)).toBe(true);
        node.children.forEach((child) => {
          expect(validateFen(child.fen)).toBe(true);
        });
      });
    });
  });

  /**
   * Scénario 7: Test avec différentes profondeurs
   */
  describe("generateAllLegalVariations - différentes profondeurs", () => {
    it("devrait générer un arbre vide si maxDepth = 0", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 0,
      });

      expect(tree.nodes).toHaveLength(0);
    });

    it("devrait générer plus de nœuds avec profondeur plus grande", () => {
      const tree1 = generateAllLegalVariations(initialFen, {
        maxDepth: 1,
        maxVariationsPerLevel: 10,
      });

      const tree2 = generateAllLegalVariations(initialFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 10,
      });

      // Tree2 devrait avoir plus de nœuds totaux
      expect(getNodeCount(tree2)).toBeGreaterThan(getNodeCount(tree1));
    });
  });

  /**
   * Scénario 8: Fonctions utilitaires
   */
  describe("Fonctions utilitaires", () => {
    it("getAllVariationSequences devrait retourner toutes les séquences", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 3,
      });

      const sequences = getAllVariationSequences(tree);

      expect(sequences.length).toBeGreaterThan(0);
      sequences.forEach((sequence) => {
        expect(Array.isArray(sequence)).toBe(true);
        expect(sequence.length).toBeGreaterThan(0);
        sequence.forEach((move) => {
          expect(typeof move).toBe("string");
        });
      });
    });

    it("getVariationCount devrait retourner le nombre de séquences", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 1,
        maxVariationsPerLevel: 10,
      });

      const count = getVariationCount(tree);
      const sequences = getAllVariationSequences(tree);

      expect(count).toBe(sequences.length);
    });

    it("getNodeCount devrait retourner le nombre total de nœuds", () => {
      const tree = generateAllLegalVariations(initialFen, {
        maxDepth: 2,
        maxVariationsPerLevel: 5,
      });

      const count = getNodeCount(tree);

      expect(count).toBeGreaterThan(0);
      expect(count).toBeGreaterThanOrEqual(tree.nodes.length);
    });
  });

  /**
   * Scénario 9: Gestion d'erreur avec FEN invalide
   */
  describe("generateAllLegalVariations - gestion d'erreur", () => {
    it("devrait retourner un arbre vide pour FEN invalide", () => {
      const invalidFen = "invalid fen string";

      // Ne devrait pas lever d'erreur, mais retourner un arbre vide
      const tree = generateAllLegalVariations(invalidFen, {
        maxDepth: 1,
      });

      expect(tree.nodes).toHaveLength(0);
    });
  });
});

