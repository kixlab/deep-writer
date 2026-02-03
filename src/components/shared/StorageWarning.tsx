'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';
import { exportSession } from '@/lib/export';

// --- Component ---

export function StorageWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const checkStorageUsage = useSessionStore((s) => s.checkStorageUsage);

  const checkStorage = useCallback(() => {
    const usage = checkStorageUsage();
    const rounded = Math.round(usage.percentage);
    setPercentage(rounded);

    if (usage.percentage >= 80) {
      if (!dismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
      setDismissed(false);
    }
  }, [checkStorageUsage, dismissed]);

  useEffect(() => {
    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, [checkStorage]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
  };

  const handleExportNow = () => {
    const session = useSessionStore.getState().getExportData();
    if (session) {
      exportSession(session);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
    >
      <p>
        Storage is nearly full ({percentage}% used). Please export your session
        data.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleExportNow}
          className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
        >
          Export Now
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-800/50"
          aria-label="Dismiss storage warning"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
