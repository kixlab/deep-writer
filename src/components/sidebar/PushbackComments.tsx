'use client';

// --- Component ---

export function PushbackComments() {
  return (
    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Pushback
      </h3>
      <p className="text-sm italic text-gray-400 dark:text-gray-500">
        No active pushback warnings.
      </p>
    </div>
  );
}
