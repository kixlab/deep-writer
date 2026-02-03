'use client';

// --- Types ---

interface SkeletonPlaceholderProps {
  lines?: number;
}

// --- Constants ---

const LINE_WIDTHS = ['w-[90%]', 'w-[70%]', 'w-[85%]', 'w-[60%]', 'w-[75%]', 'w-[80%]'];

// --- Component ---

export function SkeletonPlaceholder({ lines = 3 }: SkeletonPlaceholderProps) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
