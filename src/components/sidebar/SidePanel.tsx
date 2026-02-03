'use client';

import { useLayoutStore } from '@/stores/useLayoutStore';

// --- Types ---

interface SidePanelProps {
  children: React.ReactNode;
}

// --- Component ---

export function SidePanel({ children }: SidePanelProps) {
  const { isSidePanelOpen, toggleSidePanel } = useLayoutStore();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <button
          onClick={toggleSidePanel}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label={isSidePanelOpen ? 'Collapse side panel' : 'Expand side panel'}
        >
          <svg
            className={`h-4 w-4 transition-transform ${isSidePanelOpen ? '' : 'rotate-180'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Panel
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
