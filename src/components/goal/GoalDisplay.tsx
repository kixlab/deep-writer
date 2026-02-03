'use client';

import { useState } from 'react';

// --- Types ---

interface GoalDisplayProps {
  goal: string;
  onEdit?: () => void;
}

// --- Constants ---

const MAX_COLLAPSED_LENGTH = 60;

// --- Component ---

export function GoalDisplay({ goal, onEdit }: GoalDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const needsTruncation = goal.length > MAX_COLLAPSED_LENGTH;
  const displayText =
    isExpanded || !needsTruncation
      ? goal
      : `${goal.slice(0, MAX_COLLAPSED_LENGTH)}...`;

  const toggleExpanded = () => {
    if (needsTruncation) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleExpanded}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse goal' : 'Expand goal'}
      >
        {needsTruncation && (
          <svg
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        <span className="max-w-md">{displayText}</span>
      </button>

      {onEdit && (
        <button
          onClick={onEdit}
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Edit goal"
        >
          <svg
            className="h-3.5 w-3.5"
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
        </button>
      )}
    </div>
  );
}
