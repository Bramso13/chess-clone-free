/**
 * Composant TreeView pour afficher l'arbre de variantes
 * Affiche une vue arborescente avec expansion/réduction et codes couleur pour évaluations
 */

"use client";

import { useState, useMemo } from "react";
import type {
  VariationTree,
  VariationNode,
  AnalyzedVariation,
} from "@/types/chess";

interface VariationTreeViewProps {
  /** Arbre de variantes à afficher */
  tree: VariationTree;
  /** Variantes analysées par Stockfish */
  analyzedVariations: AnalyzedVariation[];
  /** Nœud actuellement sélectionné */
  selectedNode: VariationNode | null;
  /** Callback appelé quand un nœud est sélectionné */
  onNodeSelect: (node: VariationNode) => void;
  /** Filtre optionnel par plage d'évaluation */
  evaluationFilter?: { min: number; max: number };
}

/**
 * Obtient l'évaluation d'un nœud depuis les variantes analysées
 */
function getNodeEvaluation(
  node: VariationNode,
  analyzedVariations: AnalyzedVariation[]
): number | null {
  const analyzed = analyzedVariations.find((av) => av.fen === node.fen);
  return analyzed?.evaluation ?? null;
}

/**
 * Obtient la couleur selon l'évaluation
 */
function getEvaluationColor(evaluation: number | null): string {
  if (evaluation === null) return "bg-gray-100";
  if (evaluation > 50) return "bg-green-500 text-white";
  if (evaluation > 0) return "bg-green-200";
  if (evaluation > -50) return "bg-red-200";
  return "bg-red-500 text-white";
}

/**
 * Composant pour un nœud individuel de l'arbre
 */
function TreeNode({
  node,
  analyzedVariations,
  selectedNode,
  onNodeSelect,
  evaluationFilter,
  level = 0,
}: {
  node: VariationNode;
  analyzedVariations: AnalyzedVariation[];
  selectedNode: VariationNode | null;
  onNodeSelect: (node: VariationNode) => void;
  evaluationFilter?: { min: number; max: number };
  level?: number;
}) {
  const [expanded, setExpanded] = useState(level < 2); // Expandir les 2 premiers niveaux par défaut
  const evaluation = getNodeEvaluation(node, analyzedVariations);
  const hasChildren = node.children.length > 0;

  // Filtrer selon l'évaluation si un filtre est défini
  const shouldShow =
    !evaluationFilter ||
    evaluation === null ||
    (evaluation >= evaluationFilter.min && evaluation <= evaluationFilter.max);

  if (!shouldShow) return null;

  const isSelected = selectedNode?.fen === node.fen;
  const colorClass = getEvaluationColor(evaluation);

  return (
    <div className="ml-4">
      <div
        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
          isSelected ? "bg-blue-100 border-2 border-blue-500" : ""
        }`}
        onClick={() => onNodeSelect(node)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900"
          >
            {expanded ? "−" : "+"}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        <span className="font-mono font-semibold">{node.move}</span>
        {evaluation !== null && (
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}
          >
            {evaluation > 0 ? "+" : ""}
            {(evaluation / 100).toFixed(2)}
          </span>
        )}
        {hasChildren && (
          <span className="text-xs text-gray-500">
            ({node.children.length})
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="mt-1">
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.fen}-${index}`}
              node={child}
              analyzedVariations={analyzedVariations}
              selectedNode={selectedNode}
              onNodeSelect={onNodeSelect}
              evaluationFilter={evaluationFilter}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Composant principal TreeView
 */
export function VariationTreeView({
  tree,
  analyzedVariations,
  selectedNode,
  onNodeSelect,
  evaluationFilter,
}: VariationTreeViewProps) {
  return (
    <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded p-4">
      <div className="mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Avantage blanc</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Avantage noir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Non analysé</span>
          </div>
        </div>
      </div>
      {tree.nodes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Aucune variante générée
        </p>
      ) : (
        <div>
          {tree.nodes.map((node, index) => (
            <TreeNode
              key={`${node.fen}-${index}`}
              node={node}
              analyzedVariations={analyzedVariations}
              selectedNode={selectedNode}
              onNodeSelect={onNodeSelect}
              evaluationFilter={evaluationFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

