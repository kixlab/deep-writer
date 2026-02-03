'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAlternatives } from '@/hooks/useAlternatives';

// --- Types ---

interface AlternativesTooltipProps {
  selectionRect: DOMRect;
  selectedText: string;
  context: string;
  goal: string;
  onReplace: (alternative: string) => void;
  onDismiss: () => void;
}

// --- Constants ---

const VIEWPORT_MARGIN = 8;
const TOOLTIP_MAX_WIDTH = 400;
const TOOLTIP_GAP = 6;

// --- Helpers ---

function computePosition(
  selectionRect: DOMRect,
): { top: number; left: number; placement: 'below' | 'above' } {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Determine vertical placement: prefer below, flip above if near bottom
  const spaceBelow = viewportHeight - selectionRect.bottom;
  const placement = spaceBelow < 160 ? 'above' : 'below';

  let top: number;
  if (placement === 'below') {
    top = selectionRect.bottom + TOOLTIP_GAP;
  } else {
    // Will be adjusted after render when we know tooltip height.
    // Start with a reasonable offset above the selection.
    top = selectionRect.top - TOOLTIP_GAP;
  }

  // Horizontal: center on selection, clamp to viewport
  let left = selectionRect.left + selectionRect.width / 2 - TOOLTIP_MAX_WIDTH / 2;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - TOOLTIP_MAX_WIDTH - VIEWPORT_MARGIN));

  // Clamp vertical within viewport
  top = Math.max(VIEWPORT_MARGIN, top);

  return { top, left, placement };
}

// --- Component ---

export function AlternativesTooltip({
  selectionRect,
  selectedText,
  context,
  goal,
  onReplace,
  onDismiss,
}: AlternativesTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { alternatives, isLoading, error, fetchAlternatives, reset } = useAlternatives();

  // Fetch alternatives on mount
  useEffect(() => {
    fetchAlternatives(selectedText, context, goal);
  }, [fetchAlternatives, selectedText, context, goal]);

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
    function handleMouseDown(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onDismiss]);

  // Adjust position for above-placement after render
  useEffect(() => {
    if (!tooltipRef.current) return;
    const { placement } = computePosition(selectionRect);
    if (placement === 'above') {
      const tooltipHeight = tooltipRef.current.offsetHeight;
      tooltipRef.current.style.top = `${Math.max(
        VIEWPORT_MARGIN,
        selectionRect.top - TOOLTIP_GAP - tooltipHeight,
      )}px`;
    }
  });

  const handleItemClick = useCallback(
    (alternative: string) => {
      onReplace(alternative);
      onDismiss();
    },
    [onReplace, onDismiss],
  );

  const handleRetry = useCallback(() => {
    reset();
    fetchAlternatives(selectedText, context, goal);
  }, [reset, fetchAlternatives, selectedText, context, goal]);

  const { top, left } = computePosition(selectionRect);

  return (
    <div
      ref={tooltipRef}
      className="alternatives-tooltip"
      style={{
        position: 'fixed',
        top,
        left,
        maxWidth: TOOLTIP_MAX_WIDTH,
        zIndex: 9999,
      }}
      role="listbox"
      aria-label="Alternative phrasings"
    >
      {isLoading && (
        <div className="alternatives-tooltip-loading">
          <div className="alternatives-tooltip-skeleton" />
          <div className="alternatives-tooltip-skeleton" />
          <div className="alternatives-tooltip-skeleton" />
        </div>
      )}

      {error && (
        <div className="alternatives-tooltip-error">
          <span>{error}</span>
          <button
            className="alternatives-tooltip-retry"
            onClick={handleRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {alternatives && alternatives.length > 0 && (
        <div>
          {alternatives.map((alt, index) => (
            <button
              key={index}
              className="alternatives-tooltip-item"
              onClick={() => handleItemClick(alt)}
              role="option"
              aria-selected={false}
              type="button"
            >
              {alt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
