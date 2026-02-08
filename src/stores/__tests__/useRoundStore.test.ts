import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoundStore } from '../useRoundStore';
import type { RoundType } from '@/types/contribution';
import type { ProvenanceEvent } from '@/types/provenance';

// --- Helpers ---

function resetStore() {
  useRoundStore.getState().clearRounds();
}

interface CreateRoundParams {
  type: RoundType;
  parentRounds: string[];
  prompt: string | null;
  promptLength: number;
  constraintCount: number;
  constraintTypes: string[];
  generationMode: string;
  diffActions: { accepted: number; rejected: number; edited: number };
  events: ProvenanceEvent[];
}

function makeParams(overrides: Partial<CreateRoundParams> = {}): CreateRoundParams {
  return {
    type: 'generation' as RoundType,
    parentRounds: [] as string[],
    prompt: 'Write a story',
    promptLength: 14,
    constraintCount: 0,
    constraintTypes: [] as string[],
    generationMode: 'full',
    diffActions: { accepted: 0, rejected: 0, edited: 0 },
    events: [] as ProvenanceEvent[],
    ...overrides,
  };
}

// --- Tests ---

describe('useRoundStore', () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have empty rounds map', () => {
      const { rounds } = useRoundStore.getState();
      expect(rounds.size).toBe(0);
    });

    it('should have roundCounter at 0', () => {
      expect(useRoundStore.getState().roundCounter).toBe(0);
    });
  });

  describe('AC-ROUND-001: createRound', () => {
    it('should assign roundId r-1 and roundNumber 1 to the first round', () => {
      const round = useRoundStore.getState().createRound(makeParams());

      expect(round.roundId).toBe('r-1');
      expect(round.roundNumber).toBe(1);
    });

    it('should assign roundId r-2 and roundNumber 2 to the second round', () => {
      useRoundStore.getState().createRound(makeParams());
      const round = useRoundStore.getState().createRound(makeParams());

      expect(round.roundId).toBe('r-2');
      expect(round.roundNumber).toBe(2);
    });

    it('should set timestamp close to Date.now()', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const round = useRoundStore.getState().createRound(makeParams());

      expect(round.timestamp).toBe(now);
    });

    it('should store all provided fields correctly', () => {
      const events: ProvenanceEvent[] = [
        { id: 'evt-1', type: 'ai-generation-requested', timestamp: 100, data: {} },
      ];
      const params = makeParams({
        type: 'alternative',
        parentRounds: ['r-1'],
        prompt: 'Rewrite this',
        promptLength: 12,
        constraintCount: 2,
        constraintTypes: ['tone', 'length'],
        generationMode: 'partial',
        diffActions: { accepted: 1, rejected: 2, edited: 3 },
        events,
      });

      const round = useRoundStore.getState().createRound(params);

      expect(round.type).toBe('alternative');
      expect(round.parentRounds).toEqual(['r-1']);
      expect(round.prompt).toBe('Rewrite this');
      expect(round.promptLength).toBe(12);
      expect(round.constraintCount).toBe(2);
      expect(round.constraintTypes).toEqual(['tone', 'length']);
      expect(round.generationMode).toBe('partial');
      expect(round.diffActions).toEqual({ accepted: 1, rejected: 2, edited: 3 });
      expect(round.events).toEqual(events);
    });

    it('should persist the round in the store', () => {
      useRoundStore.getState().createRound(makeParams());

      expect(useRoundStore.getState().rounds.size).toBe(1);
      expect(useRoundStore.getState().rounds.has('r-1')).toBe(true);
    });

    it('should increment roundCounter', () => {
      useRoundStore.getState().createRound(makeParams());
      expect(useRoundStore.getState().roundCounter).toBe(1);

      useRoundStore.getState().createRound(makeParams());
      expect(useRoundStore.getState().roundCounter).toBe(2);
    });
  });

  describe('AC-ROUND-002: getRound', () => {
    it('should return correct metadata for an existing round', () => {
      const created = useRoundStore.getState().createRound(makeParams({ prompt: 'Hello' }));
      const fetched = useRoundStore.getState().getRound('r-1');

      expect(fetched).toBeDefined();
      expect(fetched!.roundId).toBe(created.roundId);
      expect(fetched!.prompt).toBe('Hello');
    });

    it('should return undefined for a non-existent roundId', () => {
      const result = useRoundStore.getState().getRound('r-99');
      expect(result).toBeUndefined();
    });
  });

  describe('AC-ROUND-003: getAncestryChain (linear)', () => {
    it('should return [r-1, r-2, r-3] for a linear chain', () => {
      useRoundStore.getState().createRound(makeParams({ parentRounds: [] }));
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-1'] }));
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-2'] }));

      const chain = useRoundStore.getState().getAncestryChain('r-3');

      expect(chain.map((r) => r.roundId)).toEqual(['r-1', 'r-2', 'r-3']);
    });

    it('should return single round when it has no parents', () => {
      useRoundStore.getState().createRound(makeParams({ parentRounds: [] }));

      const chain = useRoundStore.getState().getAncestryChain('r-1');

      expect(chain.map((r) => r.roundId)).toEqual(['r-1']);
    });

    it('should return empty array for non-existent roundId', () => {
      const chain = useRoundStore.getState().getAncestryChain('r-99');
      expect(chain).toEqual([]);
    });
  });

  describe('AC-ROUND-004: getAncestryChain (branching/diamond)', () => {
    it('should return deduplicated, chronological chain for diamond pattern', () => {
      // r-1 (no parents)
      useRoundStore.getState().createRound(makeParams({ parentRounds: [] }));
      // r-2 (parent: r-1)
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-1'] }));
      // r-3 (parent: r-1)
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-1'] }));
      // r-4 (parents: r-2, r-3) - diamond merge
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-2', 'r-3'] }));

      const chain = useRoundStore.getState().getAncestryChain('r-4');

      expect(chain.map((r) => r.roundId)).toEqual(['r-1', 'r-2', 'r-3', 'r-4']);
    });

    it('should not duplicate shared ancestors', () => {
      useRoundStore.getState().createRound(makeParams({ parentRounds: [] }));
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-1'] }));
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-1'] }));
      useRoundStore.getState().createRound(makeParams({ parentRounds: ['r-2', 'r-3'] }));

      const chain = useRoundStore.getState().getAncestryChain('r-4');
      const ids = chain.map((r) => r.roundId);

      // r-1 should appear exactly once
      expect(ids.filter((id) => id === 'r-1')).toHaveLength(1);
      expect(chain).toHaveLength(4);
    });
  });

  describe('AC-ROUND-005: nextRoundId', () => {
    it('should return r-1 when no rounds exist', () => {
      expect(useRoundStore.getState().nextRoundId()).toBe('r-1');
    });

    it('should return r-4 after creating 3 rounds', () => {
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());

      expect(useRoundStore.getState().nextRoundId()).toBe('r-4');
    });

    it('should not consume the ID -- createRound after nextRoundId still produces the same ID', () => {
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());

      const predicted = useRoundStore.getState().nextRoundId();
      const round = useRoundStore.getState().createRound(makeParams());

      expect(predicted).toBe('r-4');
      expect(round.roundId).toBe('r-4');
    });
  });

  describe('getAllRounds', () => {
    it('should return empty array when no rounds exist', () => {
      expect(useRoundStore.getState().getAllRounds()).toEqual([]);
    });

    it('should return all created rounds', () => {
      useRoundStore.getState().createRound(makeParams({ prompt: 'First' }));
      useRoundStore.getState().createRound(makeParams({ prompt: 'Second' }));

      const all = useRoundStore.getState().getAllRounds();

      expect(all).toHaveLength(2);
      expect(all[0].prompt).toBe('First');
      expect(all[1].prompt).toBe('Second');
    });
  });

  describe('clearRounds', () => {
    it('should reset rounds map to empty', () => {
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());

      useRoundStore.getState().clearRounds();

      expect(useRoundStore.getState().rounds.size).toBe(0);
    });

    it('should reset roundCounter to 0', () => {
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());

      useRoundStore.getState().clearRounds();

      expect(useRoundStore.getState().roundCounter).toBe(0);
    });

    it('should allow creating rounds again from r-1 after clearing', () => {
      useRoundStore.getState().createRound(makeParams());
      useRoundStore.getState().createRound(makeParams());

      useRoundStore.getState().clearRounds();

      const round = useRoundStore.getState().createRound(makeParams());
      expect(round.roundId).toBe('r-1');
      expect(round.roundNumber).toBe(1);
    });
  });
});
