import { describe, it, expect, beforeEach } from 'vitest';
import { useContributionGraphStore } from '../useContributionGraphStore';
import type {
  RoundNodeMetadata,
  RoundNodeScores,
  RoundAnalysis,
} from '@/types/contribution';

// --- Helpers ---

function defaultMetadata(
  overrides?: Partial<RoundNodeMetadata>,
): RoundNodeMetadata {
  return {
    prompt: null,
    constraints: [],
    action: 'accepted',
    type: 'generation',
    ...overrides,
  };
}

function scores(d1: number, d2: number, d3: number): RoundNodeScores {
  return { d1, d2, d3 };
}

// --- Tests ---

describe('useContributionGraphStore', () => {
  beforeEach(() => {
    useContributionGraphStore.getState().clearGraph();
  });

  // AC-GRAPH-001: Add Node
  describe('addNode', () => {
    it('should create a node with provided scores, empty edges, and null narrative', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0.5, 0.3, 0.2), defaultMetadata());

      const node = useContributionGraphStore.getState().getNode('r-1');
      expect(node).toBeDefined();
      expect(node!.roundId).toBe('r-1');
      expect(node!.scores).toEqual({ d1: 0.5, d2: 0.3, d3: 0.2 });
      expect(node!.edges).toEqual([]);
      expect(node!.narrative).toBeNull();
    });

    it('should store metadata correctly', () => {
      const meta = defaultMetadata({
        prompt: 'test prompt',
        constraints: ['c1', 'c2'],
        action: 'edited',
        type: 'alternative',
      });
      useContributionGraphStore.getState().addNode('r-2', scores(0, 0, 0), meta);

      const node = useContributionGraphStore.getState().getNode('r-2');
      expect(node!.metadata).toEqual(meta);
    });

    it('should throw on invalid RoundType', () => {
      expect(() =>
        useContributionGraphStore
          .getState()
          .addNode(
            'r-bad',
            scores(0, 0, 0),
            defaultMetadata({ type: 'invalid' as never }),
          ),
      ).toThrow('Invalid RoundType');
    });

    it('getNode should return undefined for non-existent roundId', () => {
      const node = useContributionGraphStore.getState().getNode('non-existent');
      expect(node).toBeUndefined();
    });
  });

  // AC-GRAPH-002: Accumulated Score (Leaf Node)
  describe('accumulatedScore - leaf node', () => {
    it('should return the base score for a node with no edges', () => {
      useContributionGraphStore
        .getState()
        .addNode('r-1', scores(0.0, 0.3, 0.2), defaultMetadata());

      const result = useContributionGraphStore
        .getState()
        .accumulatedScore('r-1', 'd2');
      expect(result).toBe(0.3);
    });

    it('should return 0 for a non-existent node', () => {
      const result = useContributionGraphStore
        .getState()
        .accumulatedScore('missing', 'd1');
      expect(result).toBe(0);
    });
  });

  // AC-GRAPH-003: Accumulated Score (Linear Chain)
  describe('accumulatedScore - linear chain', () => {
    it('should compute inherited score through a single edge', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0, 0.3, 0), defaultMetadata());
      store.addNode('r-3', scores(0, 0.5, 0), defaultMetadata());

      // Add edge from r-3 to r-1 on d2
      store.updateNodeWithAnalysis('r-3', {
        roundId: 'r-3',
        scores: scores(0, 0.5, 0),
        edges: [
          {
            to: 'r-1',
            dimension: 'd2',
            strength: 0.6,
            reason: 'inherited concept',
          },
        ],
        conceptsPreserved: [],
        conceptsAdded: [],
        conceptsLost: [],
        narrativeSummary: '',
      });

      const result = useContributionGraphStore
        .getState()
        .accumulatedScore('r-3', 'd2');

      // accumulatedScore('r-1', 'd2') = 0.3 (leaf)
      // inherited = 0.3 * 0.6 / 0.6 = 0.3
      // selfWeight = 1 / 1.6 = 0.625
      // inheritWeight = 0.6 / 1.6 = 0.375
      // result = 0.5 * 0.625 + 0.3 * 0.375 = 0.3125 + 0.1125 = 0.425
      expect(result).toBeCloseTo(0.425, 5);
    });
  });

  // AC-GRAPH-004: Accumulated Score (Multi-Parent)
  describe('accumulatedScore - multi-parent', () => {
    it('should compute weighted inherited score from multiple parents', () => {
      const store = useContributionGraphStore.getState();

      // Set up the graph
      store.addNode('r-1', scores(0, 0.3, 0), defaultMetadata());
      store.addNode('r-3', scores(0, 0.5, 0), defaultMetadata());
      store.addNode('r-4', scores(0, 0.1, 0), defaultMetadata());
      store.addNode('r-5', scores(0, 0.7, 0), defaultMetadata());

      // r-3 -> r-1
      store.updateNodeWithAnalysis('r-3', {
        roundId: 'r-3',
        scores: scores(0, 0.5, 0),
        edges: [
          { to: 'r-1', dimension: 'd2', strength: 0.6, reason: '' },
        ],
        conceptsPreserved: [],
        conceptsAdded: [],
        conceptsLost: [],
        narrativeSummary: '',
      });

      // r-5 -> r-3 and r-5 -> r-4
      store.updateNodeWithAnalysis('r-5', {
        roundId: 'r-5',
        scores: scores(0, 0.7, 0),
        edges: [
          { to: 'r-3', dimension: 'd2', strength: 0.8, reason: '' },
          { to: 'r-4', dimension: 'd2', strength: 0.5, reason: '' },
        ],
        conceptsPreserved: [],
        conceptsAdded: [],
        conceptsLost: [],
        narrativeSummary: '',
      });

      const result = useContributionGraphStore
        .getState()
        .accumulatedScore('r-5', 'd2');

      // accumulatedScore('r-3', 'd2') = 0.425 (from linear chain test)
      // accumulatedScore('r-4', 'd2') = 0.1 (leaf)
      // inherited = (0.425 * 0.8 + 0.1 * 0.5) / (0.8 + 0.5)
      //           = (0.34 + 0.05) / 1.3 = 0.39 / 1.3 = 0.3
      // selfWeight = 1 / (1 + 1.3) = 1 / 2.3 ~ 0.4348
      // inheritWeight = 1.3 / 2.3 ~ 0.5652
      // result = 0.7 * 0.4348 + 0.3 * 0.5652 ~ 0.3043 + 0.1696 ~ 0.474
      expect(result).toBeCloseTo(0.474, 2);
    });
  });

  // AC-GRAPH-005: Memoization
  describe('memoization', () => {
    it('should populate the memo cache after computation', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0, 0.3, 0), defaultMetadata());

      useContributionGraphStore.getState().accumulatedScore('r-1', 'd2');

      const cache = useContributionGraphStore.getState().memoCache;
      expect(cache.size).toBeGreaterThan(0);
      expect(cache.get('r-1:d2')).toBe(0.3);
    });

    it('should return the same value on second call', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0, 0.3, 0), defaultMetadata());

      const first = useContributionGraphStore
        .getState()
        .accumulatedScore('r-1', 'd2');
      const second = useContributionGraphStore
        .getState()
        .accumulatedScore('r-1', 'd2');

      expect(first).toBe(second);
    });

    it('should invalidate cache after updateNodeWithAnalysis', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0, 0.3, 0), defaultMetadata());

      // Compute and cache
      useContributionGraphStore.getState().accumulatedScore('r-1', 'd2');
      expect(useContributionGraphStore.getState().memoCache.size).toBeGreaterThan(0);

      // Update node - cache should be cleared
      store.updateNodeWithAnalysis('r-1', {
        roundId: 'r-1',
        scores: scores(0, 0.8, 0),
        edges: [],
        conceptsPreserved: [],
        conceptsAdded: [],
        conceptsLost: [],
        narrativeSummary: 'updated',
      });

      expect(useContributionGraphStore.getState().memoCache.size).toBe(0);

      // Recompute - should use updated scores
      const newScore = useContributionGraphStore
        .getState()
        .accumulatedScore('r-1', 'd2');
      expect(newScore).toBe(0.8);
    });

    it('should invalidate cache after addNode', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0, 0.3, 0), defaultMetadata());
      useContributionGraphStore.getState().accumulatedScore('r-1', 'd2');

      expect(useContributionGraphStore.getState().memoCache.size).toBeGreaterThan(0);

      // Adding a new node invalidates cache
      store.addNode('r-2', scores(0, 0.5, 0), defaultMetadata());

      expect(useContributionGraphStore.getState().memoCache.size).toBe(0);
    });
  });

  // AC-GRAPH-006: Update Node With Analysis
  describe('updateNodeWithAnalysis', () => {
    it('should overwrite scores, set edges, and set narrative', () => {
      const store = useContributionGraphStore.getState();
      store.addNode(
        'r-1',
        scores(0.1, 0.2, 0.3),
        defaultMetadata({ prompt: 'original' }),
      );

      const analysis: RoundAnalysis = {
        roundId: 'r-1',
        scores: { d1: 0.9, d2: 0.8, d3: 0.7 },
        edges: [
          { to: 'r-0', dimension: 'd1', strength: 0.5, reason: 'test edge' },
        ],
        conceptsPreserved: ['concept-a'],
        conceptsAdded: ['concept-b'],
        conceptsLost: ['concept-c'],
        narrativeSummary: 'A summary of the round.',
      };

      store.updateNodeWithAnalysis('r-1', analysis);

      const node = useContributionGraphStore.getState().getNode('r-1');
      expect(node).toBeDefined();
      expect(node!.scores).toEqual({ d1: 0.9, d2: 0.8, d3: 0.7 });
      expect(node!.edges).toHaveLength(1);
      expect(node!.edges[0]).toEqual({
        to: 'r-0',
        dimension: 'd1',
        strength: 0.5,
        reason: 'test edge',
      });
      expect(node!.narrative).toEqual({
        conceptsPreserved: ['concept-a'],
        conceptsAdded: ['concept-b'],
        conceptsLost: ['concept-c'],
        summary: 'A summary of the round.',
      });
      // Metadata should be preserved from original addNode
      expect(node!.metadata.prompt).toBe('original');
    });

    it('should throw for non-existent node', () => {
      expect(() =>
        useContributionGraphStore
          .getState()
          .updateNodeWithAnalysis('missing', {
            roundId: 'missing',
            scores: scores(0, 0, 0),
            edges: [],
            conceptsPreserved: [],
            conceptsAdded: [],
            conceptsLost: [],
            narrativeSummary: '',
          }),
      ).toThrow('Node "missing" not found');
    });
  });

  // AC-GRAPH-007: Composite Score
  describe('getCompositeScore', () => {
    it('should compute weighted composite from accumulated dimensions', () => {
      useContributionGraphStore
        .getState()
        .addNode('r-1', scores(0.0, 0.3, 0.2), defaultMetadata());

      const composite = useContributionGraphStore
        .getState()
        .getCompositeScore('r-1');

      // 0.35 * 0.0 + 0.40 * 0.3 + 0.25 * 0.2 = 0 + 0.12 + 0.05 = 0.17
      expect(composite).toBeCloseTo(0.17, 5);
    });

    it('should return 0 for non-existent node', () => {
      const composite = useContributionGraphStore
        .getState()
        .getCompositeScore('missing');

      // All accumulated scores return 0 for missing nodes
      // 0.35 * 0 + 0.40 * 0 + 0.25 * 0 = 0
      expect(composite).toBe(0);
    });
  });

  // clearGraph
  describe('clearGraph', () => {
    it('should reset nodes and memoCache', () => {
      const store = useContributionGraphStore.getState();
      store.addNode('r-1', scores(0.5, 0.3, 0.2), defaultMetadata());
      useContributionGraphStore.getState().accumulatedScore('r-1', 'd1');

      store.clearGraph();

      const state = useContributionGraphStore.getState();
      expect(state.nodes.size).toBe(0);
      expect(state.memoCache.size).toBe(0);
      expect(state.getNode('r-1')).toBeUndefined();
    });
  });
});
