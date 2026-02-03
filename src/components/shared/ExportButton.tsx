'use client';

import { useSessionStore } from '@/stores/useSessionStore';
import { exportSession } from '@/lib/export';

// --- Component ---

export function ExportButton() {
  const session = useSessionStore((s) => s.session);

  const handleExport = () => {
    const data = useSessionStore.getState().getExportData();
    if (data) {
      exportSession(data);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!session}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      aria-label="Export session data"
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export Session
    </button>
  );
}
