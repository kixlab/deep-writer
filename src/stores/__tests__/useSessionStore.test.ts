import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session, ProvenanceEvent } from '@/types';

// --- Mock storage service ---

const { mockDebouncedSave } = vi.hoisted(() => ({
  mockDebouncedSave: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  createDebouncedSave: () => mockDebouncedSave,
  getActiveSessionId: vi.fn(() => null),
  setActiveSessionId: vi.fn(),
  loadSession: vi.fn(() => null),
  checkStorageUsage: vi.fn(() => ({ used: 100, limit: 5242880, percentage: 0.002 })),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-nanoid-id'),
}));

// Import mocked modules for assertions
import * as storage from '@/lib/storage';
import { useSessionStore } from '../useSessionStore';

// --- Helpers ---

function resetStore() {
  useSessionStore.setState({ session: null, isInitialized: false });
}

// --- Tests ---

describe('useSessionStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('initSession', () => {
    it('should create a valid session with correct structure', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      useSessionStore.getState().initSession('Write an essay about AI');

      const { session, isInitialized } = useSessionStore.getState();

      expect(isInitialized).toBe(true);
      expect(session).not.toBeNull();
      expect(session!.id).toBe('mock-nanoid-id');
      expect(session!.goal).toBe('Write an essay about AI');
      expect(session!.goalHistory).toEqual([]);
      expect(session!.provenanceLog).toEqual([]);
      expect(session!.relianceScores).toEqual([]);
      expect(session!.createdAt).toBe(now);
      expect(session!.lastModifiedAt).toBe(now);
      expect(session!.documentState).toEqual({ type: 'doc', content: [] });

      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should call setActiveSessionId with the new session ID', () => {
      useSessionStore.getState().initSession('Test goal');

      expect(storage.setActiveSessionId).toHaveBeenCalledWith('mock-nanoid-id');
    });

    it('should trigger debounced save', () => {
      useSessionStore.getState().initSession('Test goal');

      expect(mockDebouncedSave).toHaveBeenCalledTimes(1);
      expect(mockDebouncedSave).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'Test goal' }),
      );
    });
  });

  describe('updateGoal', () => {
    beforeEach(() => {
      useSessionStore.getState().initSession('Original goal');
      vi.clearAllMocks();
    });

    it('should update the goal on the session', () => {
      useSessionStore.getState().updateGoal('New goal', 'manual');

      const { session } = useSessionStore.getState();
      expect(session!.goal).toBe('New goal');
    });

    it('should append to goalHistory correctly', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      useSessionStore.getState().updateGoal('New goal', 'manual');

      const { session } = useSessionStore.getState();
      expect(session!.goalHistory).toHaveLength(1);
      expect(session!.goalHistory[0]).toEqual({
        previousGoal: 'Original goal',
        newGoal: 'New goal',
        source: 'manual',
        timestamp: now,
      });

      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should accumulate multiple goal changes', () => {
      useSessionStore.getState().updateGoal('Second goal', 'manual');
      useSessionStore.getState().updateGoal('Third goal', 'process2');

      const { session } = useSessionStore.getState();
      expect(session!.goalHistory).toHaveLength(2);
      expect(session!.goalHistory[0].newGoal).toBe('Second goal');
      expect(session!.goalHistory[1].previousGoal).toBe('Second goal');
      expect(session!.goalHistory[1].newGoal).toBe('Third goal');
      expect(session!.goalHistory[1].source).toBe('process2');
    });

    it('should update lastModifiedAt', () => {
      const before = useSessionStore.getState().session!.lastModifiedAt;

      const laterTime = before + 1000;
      vi.spyOn(Date, 'now').mockReturnValue(laterTime);

      useSessionStore.getState().updateGoal('Updated', 'inferred');

      const { session } = useSessionStore.getState();
      expect(session!.lastModifiedAt).toBe(laterTime);

      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should trigger debounced save', () => {
      useSessionStore.getState().updateGoal('New goal', 'manual');

      expect(mockDebouncedSave).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if no session exists', () => {
      resetStore();
      useSessionStore.getState().updateGoal('New goal', 'manual');

      expect(mockDebouncedSave).not.toHaveBeenCalled();
    });
  });

  describe('updateDocumentState', () => {
    beforeEach(() => {
      useSessionStore.getState().initSession('Test goal');
      vi.clearAllMocks();
    });

    it('should update the document state', () => {
      const newDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
      useSessionStore.getState().updateDocumentState(newDoc);

      const { session } = useSessionStore.getState();
      expect(session!.documentState).toEqual(newDoc);
    });

    it('should update lastModifiedAt', () => {
      const laterTime = Date.now() + 5000;
      vi.spyOn(Date, 'now').mockReturnValue(laterTime);

      useSessionStore.getState().updateDocumentState({ type: 'doc' });

      expect(useSessionStore.getState().session!.lastModifiedAt).toBe(laterTime);

      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should trigger debounced save', () => {
      useSessionStore.getState().updateDocumentState({ type: 'doc' });

      expect(mockDebouncedSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('addProvenanceEvent', () => {
    beforeEach(() => {
      useSessionStore.getState().initSession('Test goal');
      vi.clearAllMocks();
    });

    it('should append to provenance log', () => {
      const event: ProvenanceEvent = {
        id: 'evt-1',
        type: 'text-typed',
        timestamp: Date.now(),
        data: { chars: 10 },
      };

      useSessionStore.getState().addProvenanceEvent(event);

      const { session } = useSessionStore.getState();
      expect(session!.provenanceLog).toHaveLength(1);
      expect(session!.provenanceLog[0]).toEqual(event);
    });

    it('should accumulate multiple events', () => {
      const event1: ProvenanceEvent = {
        id: 'evt-1',
        type: 'text-typed',
        timestamp: Date.now(),
        data: {},
      };
      const event2: ProvenanceEvent = {
        id: 'evt-2',
        type: 'goal-changed',
        timestamp: Date.now(),
        data: {},
      };

      useSessionStore.getState().addProvenanceEvent(event1);
      useSessionStore.getState().addProvenanceEvent(event2);

      const { session } = useSessionStore.getState();
      expect(session!.provenanceLog).toHaveLength(2);
    });

    it('should trigger debounced save', () => {
      const event: ProvenanceEvent = {
        id: 'evt-1',
        type: 'text-typed',
        timestamp: Date.now(),
        data: {},
      };

      useSessionStore.getState().addProvenanceEvent(event);

      expect(mockDebouncedSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('getExportData', () => {
    it('should return null when no session exists', () => {
      const data = useSessionStore.getState().getExportData();
      expect(data).toBeNull();
    });

    it('should return the current session', () => {
      useSessionStore.getState().initSession('Export test');

      const data = useSessionStore.getState().getExportData();
      expect(data).not.toBeNull();
      expect(data!.goal).toBe('Export test');
      expect(data!.id).toBe('mock-nanoid-id');
    });
  });

  describe('loadFromStorage', () => {
    it('should return false when no active session ID exists', () => {
      const result = useSessionStore.getState().loadFromStorage();
      expect(result).toBe(false);
    });

    it('should return false when session is not found in storage', () => {
      vi.mocked(storage.getActiveSessionId).mockReturnValueOnce('some-id');
      vi.mocked(storage.loadSession).mockReturnValueOnce(null);

      const result = useSessionStore.getState().loadFromStorage();
      expect(result).toBe(false);
    });

    it('should restore a saved session and return true', () => {
      const savedSession: Session = {
        id: 'saved-session',
        goal: 'Restored goal',
        goalHistory: [],
        provenanceLog: [],
        relianceScores: [],
        documentState: { type: 'doc', content: [] },
        createdAt: 1700000000000,
        lastModifiedAt: 1700000000000,
      };

      vi.mocked(storage.getActiveSessionId).mockReturnValueOnce('saved-session');
      vi.mocked(storage.loadSession).mockReturnValueOnce(savedSession);

      const result = useSessionStore.getState().loadFromStorage();

      expect(result).toBe(true);
      expect(useSessionStore.getState().session).toEqual(savedSession);
      expect(useSessionStore.getState().isInitialized).toBe(true);
    });
  });

  describe('checkStorageUsage', () => {
    it('should proxy to the storage service', () => {
      const usage = useSessionStore.getState().checkStorageUsage();

      expect(storage.checkStorageUsage).toHaveBeenCalled();
      expect(usage).toEqual({ used: 100, limit: 5242880, percentage: 0.002 });
    });
  });
});
