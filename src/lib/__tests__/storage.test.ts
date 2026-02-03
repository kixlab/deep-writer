import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Session } from '@/types';
import {
  saveSession,
  loadSession,
  getActiveSessionId,
  setActiveSessionId,
  checkStorageUsage,
  createDebouncedSave,
  retryFailedWrites,
  getFailedWriteCount,
  deleteSession,
} from '../storage';

// --- Test Helpers ---

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-session-1',
    goal: 'Write an essay about AI',
    goalHistory: [],
    documentState: { type: 'doc', content: [] },
    provenanceLog: [],
    relianceScores: [],
    createdAt: 1700000000000,
    lastModifiedAt: 1700000000000,
    ...overrides,
  };
}

// --- Mock localStorage ---

function createMockLocalStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('storage', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveSession and loadSession', () => {
    it('should save and load a session roundtrip', () => {
      const session = createMockSession();
      saveSession(session);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'cowrithink-session-test-session-1',
        JSON.stringify(session),
      );

      const loaded = loadSession('test-session-1');
      expect(loaded).toEqual(session);
    });

    it('should return null for a non-existent session', () => {
      const loaded = loadSession('does-not-exist');
      expect(loaded).toBeNull();
    });

    it('should return null for corrupted JSON data', () => {
      (mockStorage.setItem as ReturnType<typeof vi.fn>)(
        'cowrithink-session-corrupt',
        '{invalid json',
      );
      const loaded = loadSession('corrupt');
      expect(loaded).toBeNull();
    });

    it('should overwrite an existing session with the same ID', () => {
      const session1 = createMockSession({ goal: 'First goal' });
      const session2 = createMockSession({ goal: 'Updated goal' });

      saveSession(session1);
      saveSession(session2);

      const loaded = loadSession('test-session-1');
      expect(loaded?.goal).toBe('Updated goal');
    });
  });

  describe('getActiveSessionId and setActiveSessionId', () => {
    it('should return null when no active session is set', () => {
      expect(getActiveSessionId()).toBeNull();
    });

    it('should set and get the active session ID', () => {
      setActiveSessionId('session-abc');
      expect(getActiveSessionId()).toBe('session-abc');
    });

    it('should overwrite the previous active session ID', () => {
      setActiveSessionId('session-1');
      setActiveSessionId('session-2');
      expect(getActiveSessionId()).toBe('session-2');
    });
  });

  describe('checkStorageUsage', () => {
    it('should return zero usage for empty storage', () => {
      const usage = checkStorageUsage();
      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(5 * 1024 * 1024);
      expect(usage.percentage).toBe(0);
    });

    it('should calculate correct usage for stored items', () => {
      // Directly invoke the mock to populate the backing store
      (mockStorage.setItem as ReturnType<typeof vi.fn>)('key1', 'val1');
      (mockStorage.setItem as ReturnType<typeof vi.fn>)('key2', 'value2');

      const usage = checkStorageUsage();

      // key1 (4) + val1 (4) = 8 chars -> 16 bytes
      // key2 (4) + value2 (6) = 10 chars -> 20 bytes
      // total = 36 bytes
      expect(usage.used).toBe(36);
      expect(usage.percentage).toBeCloseTo((36 / (5 * 1024 * 1024)) * 100, 5);
    });

    it('should return correct limit of 5MB', () => {
      const usage = checkStorageUsage();
      expect(usage.limit).toBe(5 * 1024 * 1024);
    });
  });

  describe('createDebouncedSave', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not save immediately', () => {
      const debouncedSave = createDebouncedSave(300);
      const session = createMockSession();

      debouncedSave(session);

      // setItem should not have been called yet (only from the debounced call)
      const calls = (mockStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      expect(calls.length).toBe(0);
    });

    it('should save after the delay elapses', () => {
      const debouncedSave = createDebouncedSave(300);
      const session = createMockSession();

      debouncedSave(session);
      vi.advanceTimersByTime(300);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'cowrithink-session-test-session-1',
        JSON.stringify(session),
      );
    });

    it('should reset the timer on subsequent calls', () => {
      const debouncedSave = createDebouncedSave(300);
      const session1 = createMockSession({ goal: 'First' });
      const session2 = createMockSession({ goal: 'Second' });

      debouncedSave(session1);
      vi.advanceTimersByTime(200);

      // Call again before the first timer fires
      debouncedSave(session2);
      vi.advanceTimersByTime(200);

      // First timer was cleared; second hasn't fired yet
      expect(
        (mockStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBe(0);

      vi.advanceTimersByTime(100);

      // Now the second timer fires with session2
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
      const savedValue = (mockStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      expect(JSON.parse(savedValue).goal).toBe('Second');
    });

    it('should use 300ms as the default delay', () => {
      const debouncedSave = createDebouncedSave();
      const session = createMockSession();

      debouncedSave(session);

      vi.advanceTimersByTime(299);
      expect(
        (mockStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBe(0);

      vi.advanceTimersByTime(1);
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('error queuing and retryFailedWrites', () => {
    it('should queue writes when QuotaExceededError is thrown', () => {
      const quotaError = new DOMException(
        'Storage quota exceeded',
        'QuotaExceededError',
      );
      (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw quotaError;
        },
      );

      const session = createMockSession();
      expect(() => saveSession(session)).toThrow();
      expect(getFailedWriteCount()).toBe(1);
    });

    it('should retry queued writes and succeed when space is available', () => {
      const quotaError = new DOMException(
        'Storage quota exceeded',
        'QuotaExceededError',
      );

      // First call throws QuotaExceededError
      (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => {
          throw quotaError;
        },
      );

      const session = createMockSession();
      expect(() => saveSession(session)).toThrow();
      expect(getFailedWriteCount()).toBe(1);

      // Restore normal setItem behavior for retry
      (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
        () => {},
      );

      const successCount = retryFailedWrites();
      expect(successCount).toBe(1);
      expect(getFailedWriteCount()).toBe(0);
    });

    it('should discard items after maximum retries', () => {
      const quotaError = new DOMException(
        'Storage quota exceeded',
        'QuotaExceededError',
      );

      // Initial write fails
      (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw quotaError;
        },
      );

      const session = createMockSession();
      expect(() => saveSession(session)).toThrow();

      // All retries also fail (localStorage.setItem still throws)
      retryFailedWrites(); // retry 1
      retryFailedWrites(); // retry 2
      retryFailedWrites(); // retry 3 - discarded

      expect(getFailedWriteCount()).toBe(0);
    });

    it('should update existing queue entry for the same key', () => {
      const quotaError = new DOMException(
        'Storage quota exceeded',
        'QuotaExceededError',
      );
      (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw quotaError;
        },
      );

      const session1 = createMockSession({ goal: 'First' });
      const session2 = createMockSession({ goal: 'Second' });

      expect(() => saveSession(session1)).toThrow();
      expect(() => saveSession(session2)).toThrow();

      // Same key, so should only have 1 entry
      expect(getFailedWriteCount()).toBe(1);
    });
  });

  describe('deleteSession', () => {
    it('should remove a session from localStorage', () => {
      const session = createMockSession();
      saveSession(session);

      deleteSession('test-session-1');

      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        'cowrithink-session-test-session-1',
      );
      expect(loadSession('test-session-1')).toBeNull();
    });

    it('should not throw when deleting a non-existent session', () => {
      expect(() => deleteSession('non-existent')).not.toThrow();
    });
  });
});
