import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProvenanceStore } from '../useProvenanceStore';

// Mock nanoid to return incrementing IDs for uniqueness testing
let nanoidCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => `mock-evt-${++nanoidCounter}`),
}));

// --- Helpers ---

function resetStore() {
  useProvenanceStore.setState({ events: [] });
  nanoidCounter = 0;
}

// --- Tests ---

describe('useProvenanceStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should create event with correct fields', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const event = useProvenanceStore.getState().logEvent('text-typed', { chars: 5 });

      expect(event.id).toBe('mock-evt-1');
      expect(event.type).toBe('text-typed');
      expect(event.timestamp).toBe(now);
      expect(event.data).toEqual({ chars: 5 });

      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should auto-generate unique IDs', () => {
      const event1 = useProvenanceStore.getState().logEvent('text-typed', {});
      const event2 = useProvenanceStore.getState().logEvent('goal-changed', {});

      expect(event1.id).not.toBe(event2.id);
      expect(event1.id).toBe('mock-evt-1');
      expect(event2.id).toBe('mock-evt-2');
    });

    it('should set timestamp automatically', () => {
      const before = Date.now();
      const event = useProvenanceStore.getState().logEvent('text-typed', {});
      const after = Date.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });

    it('should append event to the events array', () => {
      useProvenanceStore.getState().logEvent('text-typed', { chars: 5 });
      useProvenanceStore.getState().logEvent('goal-changed', { newGoal: 'test' });

      const { events } = useProvenanceStore.getState();
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('text-typed');
      expect(events[1].type).toBe('goal-changed');
    });

    it('should return the created event', () => {
      const event = useProvenanceStore.getState().logEvent('ai-generation-requested', {
        prompt: 'Write more',
      });

      expect(event).toEqual(
        expect.objectContaining({
          type: 'ai-generation-requested',
          data: { prompt: 'Write more' },
        }),
      );
    });
  });

  describe('getEventsByType', () => {
    it('should filter events by type correctly', () => {
      useProvenanceStore.getState().logEvent('text-typed', { chars: 5 });
      useProvenanceStore.getState().logEvent('goal-changed', { newGoal: 'a' });
      useProvenanceStore.getState().logEvent('text-typed', { chars: 10 });
      useProvenanceStore.getState().logEvent('ai-generation-requested', {});

      const textTyped = useProvenanceStore.getState().getEventsByType('text-typed');
      expect(textTyped).toHaveLength(2);
      expect(textTyped.every((e) => e.type === 'text-typed')).toBe(true);
    });

    it('should return empty array when no events match', () => {
      useProvenanceStore.getState().logEvent('text-typed', {});

      const result = useProvenanceStore.getState().getEventsByType('goal-changed');
      expect(result).toEqual([]);
    });

    it('should return empty array when store is empty', () => {
      const result = useProvenanceStore.getState().getEventsByType('text-typed');
      expect(result).toEqual([]);
    });
  });

  describe('getEventCount', () => {
    it('should return 0 for empty store', () => {
      expect(useProvenanceStore.getState().getEventCount()).toBe(0);
    });

    it('should return correct count', () => {
      useProvenanceStore.getState().logEvent('text-typed', {});
      useProvenanceStore.getState().logEvent('goal-changed', {});
      useProvenanceStore.getState().logEvent('ai-generation-requested', {});

      expect(useProvenanceStore.getState().getEventCount()).toBe(3);
    });
  });

  describe('clearEvents', () => {
    it('should reset the events array to empty', () => {
      useProvenanceStore.getState().logEvent('text-typed', {});
      useProvenanceStore.getState().logEvent('goal-changed', {});

      expect(useProvenanceStore.getState().events).toHaveLength(2);

      useProvenanceStore.getState().clearEvents();

      expect(useProvenanceStore.getState().events).toEqual([]);
      expect(useProvenanceStore.getState().getEventCount()).toBe(0);
    });
  });

  describe('getEvents', () => {
    it('should return all events', () => {
      useProvenanceStore.getState().logEvent('text-typed', { a: 1 });
      useProvenanceStore.getState().logEvent('goal-changed', { b: 2 });

      const events = useProvenanceStore.getState().getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('text-typed');
      expect(events[1].type).toBe('goal-changed');
    });

    it('should return empty array when no events exist', () => {
      expect(useProvenanceStore.getState().getEvents()).toEqual([]);
    });
  });
});
