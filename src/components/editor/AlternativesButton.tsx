'use client';

import { useEffect, useRef } from 'react';

interface AlternativesButtonProps {
  selectionRect: DOMRect;
  onGenerate: () => void;
  onDismiss: () => void;
}

export function AlternativesButton({
  selectionRect,
  onGenerate,
  onDismiss,
}: AlternativesButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  // Dismiss when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDismiss]);

  // Position the button near the selection
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${selectionRect.left}px`,
    top: `${selectionRect.bottom + 8}px`,
    zIndex: 1000,
  };

  return (
    <div ref={buttonRef} style={style}>
      <button
        onClick={onGenerate}
        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 shadow-md hover:bg-blue-50 dark:border-blue-800 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
      >
        <span className="text-base">✨</span>
        Alternatives
      </button>
    </div>
  );
}
