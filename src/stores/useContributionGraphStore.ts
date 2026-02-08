import { create } from 'zustand';
import type {
  Dimension,
  Edge,
  RoundAnalysis,
  RoundNode,
  RoundNodeMetadata,
  RoundNodeScores,
} from '@/types/contribution';
import { computeCompositeScore } from '@/lib/scoring';

// --- Types ---

interface ContributionGraphState {
  nodes: Map<string, RoundNode>;
  memoCache: Map<string, number>;
}

interface ContributionGraphActions {
  addNode: (
    roundId: string,
    baseScores: RoundNodeScores,
    metadata: RoundNodeMetadata,
  ) => void;
  updateNodeWithAnalysis: (roundId: string, analysis: RoundAnalysis) => void;
  getNode: (roundId: string) => RoundNode | undefined;
  accumulatedScore: (roundId: string, dimension: Dimension) => number;
  getCompositeScore: (roundId: string) => number;
  clearGraph: () => void;
}

type ContributionGraphStore = ContributionGraphState & ContributionGraphActions;

// --- Valid round types for validation ---

const VALID_ROUND_TYPES = new Set(['generation', 'alternative']);

// --- Store ---

export const useContributionGraphStore = create<ContributionGraphStore>()(
  (set, get) => ({
    nodes: new Map(),
    memoCache: new Map(),

    addNode: (
      roundId: string,
      baseScores: RoundNodeScores,
      metadata: RoundNodeMetadata,
    ) => {
      if (!VALID_ROUND_TYPES.has(metadata.type)) {
        throw new Error(
          `Invalid RoundType: "${metadata.type}". Must be "generation" or "alternative".`,
        );
      }

      const node: RoundNode = {
        roundId,
        scores: baseScores,
        edges: [],
        metadata,
        narrative: null,
      };

      const nodes = new Map(get().nodes);
      nodes.set(roundId, node);
      set({ nodes, memoCache: new Map() });
    },

    updateNodeWithAnalysis: (roundId: string, analysis: RoundAnalysis) => {
      const existing = get().nodes.get(roundId);
      if (!existing) {
        throw new Error(
          `Node "${roundId}" not found. Cannot update with analysis.`,
        );
      }

      const updated: RoundNode = {
        ...existing,
        scores: analysis.scores,
        edges: analysis.edges,
        narrative: {
          conceptsPreserved: analysis.conceptsPreserved,
          conceptsAdded: analysis.conceptsAdded,
          conceptsLost: analysis.conceptsLost,
          summary: analysis.narrativeSummary,
        },
      };

      const nodes = new Map(get().nodes);
      nodes.set(roundId, updated);
      set({ nodes, memoCache: new Map() });
    },

    getNode: (roundId: string): RoundNode | undefined => {
      return get().nodes.get(roundId);
    },

    accumulatedScore: (roundId: string, dimension: Dimension): number => {
      const state = get();
      const cacheKey = `${roundId}:${dimension}`;
      const cached = state.memoCache.get(cacheKey);
      if (cached !== undefined) return cached;

      const nodes = state.nodes;
      const localMemo = new Map(state.memoCache);

      function compute(rid: string, dim: Dimension): number {
        const key = `${rid}:${dim}`;
        if (localMemo.has(key)) return localMemo.get(key)!;

        const node = nodes.get(rid);
        if (!node) return 0;

        const dimEdges: Edge[] = node.edges.filter(
          (e) => e.dimension === dim,
        );

        if (dimEdges.length === 0) {
          localMemo.set(key, node.scores[dim]);
          return node.scores[dim];
        }

        let weightedSum = 0;
        let totalStrength = 0;
        for (const edge of dimEdges) {
          const parentScore = compute(edge.to, dim);
          weightedSum += parentScore * edge.strength;
          totalStrength += edge.strength;
        }

        const inherited = weightedSum / totalStrength;
        const selfWeight = 1 / (1 + totalStrength);
        const inheritWeight = totalStrength / (1 + totalStrength);
        const result =
          node.scores[dim] * selfWeight + inherited * inheritWeight;

        localMemo.set(key, result);
        return result;
      }

      const result = compute(roundId, dimension);
      set({ memoCache: localMemo });
      return result;
    },

    getCompositeScore: (roundId: string): number => {
      const { accumulatedScore } = get();
      const d1 = accumulatedScore(roundId, 'd1');
      const d2 = accumulatedScore(roundId, 'd2');
      const d3 = accumulatedScore(roundId, 'd3');
      return computeCompositeScore(d1, d2, d3);
    },

    clearGraph: () => {
      set({ nodes: new Map(), memoCache: new Map() });
    },
  }),
);
