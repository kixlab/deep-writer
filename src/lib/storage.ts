import type { Session } from '@/types';

// --- Constants ---

const STORAGE_PREFIX = 'cowrithink-session-';
const ACTIVE_SESSION_KEY = 'cowrithink-active-session';
const ESTIMATED_STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes
const MAX_RETRIES = 3;

// --- Error Queue ---

interface FailedWrite {
  key: string;
  value: string;
  retryCount: number;
}

const failedWriteQueue: FailedWrite[] = [];

// --- Internal Helpers ---

function sessionKey(sessionId: string): string {
  return `${STORAGE_PREFIX}${sessionId}`;
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error: unknown) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.code === DOMException.QUOTA_EXCEEDED_ERR)
    ) {
      const existing = failedWriteQueue.find((item) => item.key === key);
      if (existing) {
        existing.value = value;
        existing.retryCount = 0;
      } else {
        failedWriteQueue.push({ key, value, retryCount: 0 });
      }
    }
    throw error;
  }
}

// --- Public API ---

/**
 * Save a session to localStorage.
 * On QuotaExceededError, the write is queued for retry.
 */
export function saveSession(session: Session): void {
  const key = sessionKey(session.id);
  const value = JSON.stringify(session);
  safeSetItem(key, value);
}

/**
 * Load a session from localStorage by ID.
 * Returns null if the session does not exist or the stored data is invalid.
 */
export function loadSession(sessionId: string): Session | null {
  const key = sessionKey(sessionId);
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/**
 * Get the currently active session ID.
 */
export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

/**
 * Set the currently active session ID.
 */
export function setActiveSessionId(sessionId: string): void {
  localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

/**
 * Check localStorage capacity usage.
 * Calculates used bytes by summing (key.length + value.length) * 2 for UTF-16 encoding.
 */
export function checkStorageUsage(): {
  used: number;
  limit: number;
  percentage: number;
} {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null) {
      const value = localStorage.getItem(key) ?? '';
      used += (key.length + value.length) * 2;
    }
  }
  return {
    used,
    limit: ESTIMATED_STORAGE_LIMIT,
    percentage: (used / ESTIMATED_STORAGE_LIMIT) * 100,
  };
}

/**
 * Create a debounced version of saveSession.
 * @param delay Debounce delay in milliseconds (default: 300)
 */
export function createDebouncedSave(
  delay: number = 300,
): (session: Session) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (session: Session): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      saveSession(session);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Retry all failed writes in the queue.
 * Each item gets up to MAX_RETRIES attempts before being discarded.
 * Returns the number of successfully retried writes.
 */
export function retryFailedWrites(): number {
  let successCount = 0;
  const remainingItems: FailedWrite[] = [];

  while (failedWriteQueue.length > 0) {
    const item = failedWriteQueue.shift()!;
    try {
      localStorage.setItem(item.key, item.value);
      successCount++;
    } catch {
      item.retryCount++;
      if (item.retryCount < MAX_RETRIES) {
        remainingItems.push(item);
      }
      // Discard items that have exceeded MAX_RETRIES
    }
  }

  // Put remaining items back in the queue
  failedWriteQueue.push(...remainingItems);

  return successCount;
}

/**
 * Get the current number of items in the failed write queue.
 */
export function getFailedWriteCount(): number {
  return failedWriteQueue.length;
}

/**
 * Delete a session from localStorage.
 */
export function deleteSession(sessionId: string): void {
  const key = sessionKey(sessionId);
  localStorage.removeItem(key);
}
