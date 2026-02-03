'use client';

import type { Editor } from '@tiptap/core';
import { useLoadingStore } from '@/stores/useLoadingStore';

// --- Types ---

interface RegenerateButtonProps {
  editor: Editor | null;
  onRegenerate: () => void;
}

// --- Helpers ---

function hasMarkedDeleteSegments(editor: Editor | null): boolean {
  if (!editor) return false;

  const { doc } = editor.state;
  const markType = editor.schema.marks.textState;
  if (!markType) return false;

  let found = false;
  doc.descendants((node) => {
    if (found) return false;
    if (!node.isText) return;

    const textStateMark = node.marks.find((m) => m.type === markType);
    if (textStateMark?.attrs.state === 'marked-delete') {
      found = true;
      return false;
    }
  });

  return found;
}

// --- Component ---

export function RegenerateButton({ editor, onRegenerate }: RegenerateButtonProps) {
  const isGenerating = useLoadingStore((s) => s.isGenerating);
  const hasMarks = hasMarkedDeleteSegments(editor);
  const isDisabled = !hasMarks || isGenerating;

  return (
    <div className="flex items-center justify-center px-4 py-2">
      <button
        onClick={onRegenerate}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:disabled:border-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-600"
        aria-label="Regenerate marked text"
      >
        {isGenerating ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="1 4 1 10 7 10" />
              <polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            Regenerate
          </>
        )}
      </button>
    </div>
  );
}
