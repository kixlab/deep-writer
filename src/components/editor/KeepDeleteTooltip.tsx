'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface KeepDeleteTooltipProps {
  selectionRect: DOMRect;
  onKeep: () => void;
  onDelete: () => void;
  onDismiss: () => void;
}

/**
 * Compact floating tooltip with Keep (green) and Delete (red) buttons.
 * Appears near a clause selection in the Modified diff panel.
 * Positioned below the selection (or above if near viewport bottom).
 * Dismisses on Escape or click outside.
 */
export function KeepDeleteTooltip({
  selectionRect,
  onKeep,
  onDelete,
  onDismiss,
}: KeepDeleteTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate position: below the selection, centered horizontally
  const gap = 6;
  const tooltipHeight = 36; // approximate height of the tooltip
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Place below selection by default, above if too close to viewport bottom
  const placeAbove = selectionRect.bottom + gap + tooltipHeight > viewportHeight - 16;
  const top = placeAbove
    ? selectionRect.top - gap - tooltipHeight
    : selectionRect.bottom + gap;
  const left = selectionRect.left + selectionRect.width / 2;

  // Dismiss on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDismiss();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  // Dismiss on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    }
    // Delay to avoid the same mouseup that opened the tooltip from closing it
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onDismiss]);

  const handleKeep = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onKeep();
    },
    [onKeep],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  return (
    <div
      ref={tooltipRef}
      className="keep-delete-tooltip"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
      role="toolbar"
      aria-label="Clause action"
    >
      <button
        type="button"
        className="keep-delete-btn keep-delete-btn-keep"
        onClick={handleKeep}
        aria-label="Keep selected clause"
      >
        Keep
      </button>
      <button
        type="button"
        className="keep-delete-btn keep-delete-btn-delete"
        onClick={handleDelete}
        aria-label="Delete selected clause"
      >
        Delete
      </button>
    </div>
  );
}
