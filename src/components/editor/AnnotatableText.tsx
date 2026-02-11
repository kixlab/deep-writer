'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// --- Types ---

export type WordAnnotation = 'positive' | 'negative' | 'keep' | 'delete';

export interface AnnotatableWord {
  text: string;
  diffType?: 'equal' | 'added' | 'removed';
}

interface AnnotatableTextProps {
  words: AnnotatableWord[];
  annotations: Map<number, WordAnnotation>;
  onAnnotationChange: (annotations: Map<number, WordAnnotation>) => void;
  highlights?: Set<number>;
}

interface SelectionRange {
  start: number;
  end: number;
}

// --- Helpers ---

function secondClickConvert(current: WordAnnotation): WordAnnotation | undefined {
  if (current === 'positive') return 'keep';
  if (current === 'negative') return 'delete';
  return undefined; // keep/delete -> remove
}

function rangeIndices(range: SelectionRange): Set<number> {
  const set = new Set<number>();
  const lo = Math.min(range.start, range.end);
  const hi = Math.max(range.start, range.end);
  for (let i = lo; i <= hi; i++) set.add(i);
  return set;
}

function classForWord(
  word: AnnotatableWord,
  annotation: WordAnnotation | undefined,
  highlighted?: boolean,
  isSelected?: boolean,
): string {
  const parts = ['annotatable-word'];
  if (word.diffType && word.diffType !== 'equal') {
    parts.push(`alt-diff-${word.diffType}`);
  }
  if (annotation === 'positive') parts.push('word-annotation-positive');
  if (annotation === 'negative') parts.push('word-annotation-negative');
  if (annotation === 'keep') parts.push('word-annotation-keep');
  if (annotation === 'delete') parts.push('word-annotation-delete');
  if (highlighted) parts.push('word-highlight-removed');
  if (isSelected) parts.push('word-annotation-selected');
  return parts.join(' ');
}

// --- WordAnnotationPopup ---

interface WordAnnotationPopupProps {
  targetRect: DOMRect;
  onSelect: (label: WordAnnotation) => void;
  onDismiss: () => void;
}

const POPUP_BUTTONS: { label: string; value: WordAnnotation; className: string }[] = [
  { label: 'Del', value: 'delete', className: 'word-popup-btn-delete' },
  { label: '\u2212', value: 'negative', className: 'word-popup-btn-negative' },
  { label: '+', value: 'positive', className: 'word-popup-btn-positive' },
  { label: 'Keep', value: 'keep', className: 'word-popup-btn-keep' },
];

const ANNOTATION_BADGE: Record<WordAnnotation, string> = {
  delete: 'del',
  negative: '\u2212',
  positive: '+',
  keep: 'keep',
};

function WordAnnotationPopup({ targetRect, onSelect, onDismiss }: WordAnnotationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 0);
    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onDismiss]);

  const gap = 4;
  const popupHeight = 30;
  const viewportHeight = window.innerHeight;

  const placeAbove = targetRect.bottom + gap + popupHeight > viewportHeight - 8;
  const top = placeAbove
    ? targetRect.top - gap - popupHeight
    : targetRect.bottom + gap;
  const left = targetRect.left + targetRect.width / 2;

  return (
    <div
      ref={popupRef}
      className="word-annotation-popup"
      style={{
        position: 'fixed',
        top,
        left,
        transform: 'translateX(-50%)',
        zIndex: 10001,
      }}
      role="toolbar"
      aria-label="Word annotation"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {POPUP_BUTTONS.map((btn) => (
        <button
          key={btn.value}
          type="button"
          className={`word-popup-btn ${btn.className}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(btn.value);
          }}
          aria-label={`${btn.label} annotation`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// --- Helpers: compute bounding rect for word range ---

function computeRangeRect(container: HTMLElement, range: SelectionRange): DOMRect | null {
  const lo = Math.min(range.start, range.end);
  const hi = Math.max(range.start, range.end);
  const wordEls = container.querySelectorAll<HTMLElement>('.annotatable-word');
  let top = Infinity, left = Infinity, bottom = -Infinity, right = -Infinity;
  for (let i = lo; i <= hi; i++) {
    const el = wordEls[i];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.top < top) top = r.top;
    if (r.left < left) left = r.left;
    if (r.bottom > bottom) bottom = r.bottom;
    if (r.right > right) right = r.right;
  }
  if (top === Infinity) return null;
  return new DOMRect(left, top, right - left, bottom - top);
}

// --- Component ---

export function AnnotatableText({ words, annotations, onAnnotationChange, highlights }: AnnotatableTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [popupRect, setPopupRect] = useState<DOMRect | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef<number | null>(null);

  const selectedSet = selection ? rangeIndices(selection) : null;

  const clearSelection = useCallback(() => {
    setSelection(null);
    setPopupRect(null);
    setShowPopup(false);
    isDragging.current = false;
    dragStart.current = null;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();

      // If popup is already showing, dismiss it first
      if (showPopup) {
        clearSelection();
        return;
      }

      isDragging.current = true;
      dragStart.current = index;
      setSelection({ start: index, end: index });
      setShowPopup(false);
    },
    [showPopup, clearSelection],
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (!isDragging.current || dragStart.current === null) return;
      setSelection({ start: dragStart.current, end: index });
    },
    [],
  );

  useEffect(() => {
    function handleMouseUp() {
      if (!isDragging.current || dragStart.current === null) return;
      isDragging.current = false;

      // Use a microtask to read selection state after final render
      requestAnimationFrame(() => {
        setSelection((sel) => {
          if (!sel) return null;

          // Check if all selected words share the same annotation -> second-click convert
          const lo = Math.min(sel.start, sel.end);
          const hi = Math.max(sel.start, sel.end);
          let common: WordAnnotation | null = null;
          let allAnnotated = true;
          for (let i = lo; i <= hi; i++) {
            const ann = annotations.get(i);
            if (!ann) { allAnnotated = false; break; }
            if (common === null) common = ann;
            else if (common !== ann) { allAnnotated = false; break; }
          }

          if (allAnnotated && common) {
            // All words have same annotation -> convert or remove
            const next = secondClickConvert(common);
            const newAnns = new Map(annotations);
            for (let i = lo; i <= hi; i++) {
              if (next) newAnns.set(i, next);
              else newAnns.delete(i);
            }
            onAnnotationChange(newAnns);
            setShowPopup(false);
            setPopupRect(null);
            return null;
          }

          // Show popup
          if (containerRef.current) {
            const rect = computeRangeRect(containerRef.current, sel);
            if (rect) {
              setPopupRect(rect);
              setShowPopup(true);
            }
          }
          return sel;
        });
      });
    }

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [annotations, onAnnotationChange]);

  const handlePopupSelect = useCallback(
    (label: WordAnnotation) => {
      if (!selection) return;
      const lo = Math.min(selection.start, selection.end);
      const hi = Math.max(selection.start, selection.end);
      const newAnns = new Map(annotations);
      for (let i = lo; i <= hi; i++) {
        newAnns.set(i, label);
      }
      onAnnotationChange(newAnns);
      clearSelection();
    },
    [selection, annotations, onAnnotationChange, clearSelection],
  );

  return (
    <span className="annotatable-text" ref={containerRef}>
      {words.map((word, i) => {
        const ann = annotations.get(i);
        return (
          <span key={i}>
            {i > 0 && ' '}
            <span
              className={classForWord(word, ann, highlights?.has(i), selectedSet?.has(i))}
              onMouseDown={(e) => handleMouseDown(e, i)}
              onMouseEnter={() => handleMouseEnter(i)}
              role="button"
              tabIndex={-1}
            >
              {word.text}
            </span>
            {ann && (
              <span className={`word-badge word-badge-${ann}`}>{ANNOTATION_BADGE[ann]}</span>
            )}
          </span>
        );
      })}
      {showPopup && popupRect && (
        <WordAnnotationPopup
          targetRect={popupRect}
          onSelect={handlePopupSelect}
          onDismiss={clearSelection}
        />
      )}
    </span>
  );
}
