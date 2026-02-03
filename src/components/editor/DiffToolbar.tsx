'use client';

// --- Types ---

interface DiffToolbarProps {
  diffCount: number;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

// --- Component ---

export function DiffToolbar({
  diffCount,
  onAcceptAll,
  onRejectAll,
}: DiffToolbarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {diffCount} {diffCount === 1 ? 'change' : 'changes'} pending
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onRejectAll}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Reject All
        </button>
        <button
          onClick={onAcceptAll}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
