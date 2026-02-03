'use client';

// --- Types ---

interface StartModeSelectorProps {
  goal: string;
  onStartFromScratch: () => void;
  onGenerateFirstDraft: () => void;
}

// --- Component ---

export function StartModeSelector({
  goal,
  onStartFromScratch,
  onGenerateFirstDraft,
}: StartModeSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <p className="mb-6 rounded-lg bg-gray-50 p-4 text-base italic text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {goal}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onStartFromScratch}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-6 py-8 text-center transition-colors hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700"
            aria-label="Start from scratch"
          >
            <svg
              className="h-10 w-10 text-gray-500 dark:text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Start from scratch
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Write your own content from a blank page
            </span>
          </button>

          <button
            onClick={onGenerateFirstDraft}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-green-400 bg-green-50 px-6 py-8 text-center transition-colors hover:border-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:border-green-600 dark:bg-green-900/30 dark:hover:border-green-500 dark:hover:bg-green-900/50"
            aria-label="Generate AI first draft"
          >
            <svg
              className="h-10 w-10 text-green-600 dark:text-green-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-lg font-semibold text-green-800 dark:text-green-200">
              Generate AI first draft
            </span>
            <span className="text-sm text-green-700 dark:text-green-400">
              Let AI create a draft based on your goal
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
