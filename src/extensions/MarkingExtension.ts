import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EventType } from '@/types';
import {
  getWordBoundary,
  getPhraseBoundary,
  getSentenceBoundary,
} from '@/lib/boundaries';
import type { TextRange } from '@/lib/boundaries';

// --- Types ---

export type SelectionLevel = 'word' | 'phrase' | 'sentence';

export interface DragSelectionData {
  from: number;
  to: number;
  text: string;
  context: string;
  rect: DOMRect;
}

export interface MarkingExtensionOptions {
  onProvenanceEvent?: (
    type: EventType,
    data: Record<string, unknown>,
  ) => void;
  onDragSelection?: ((data: DragSelectionData) => void) | null;
}

interface MarkingPluginState {
  selectionLevel: SelectionLevel | null;
  selectedRange: TextRange | null;
  decorations: DecorationSet;
}

// --- Constants ---

const markingPluginKey = new PluginKey('marking');

const SELECTION_CLASSES: Record<SelectionLevel, string> = {
  word: 'marking-selection-word',
  phrase: 'marking-selection-phrase',
  sentence: 'marking-selection-sentence',
};

// --- Decoration Builder ---

function buildSelectionDecorations(
  state: MarkingPluginState,
  doc: ProseMirrorNode,
): DecorationSet {
  const decorations: Decoration[] = [];

  if (state.selectedRange && state.selectionLevel) {
    const { from, to } = state.selectedRange;
    if (from >= 0 && to <= doc.content.size && from < to) {
      decorations.push(
        Decoration.inline(from, to, {
          class: SELECTION_CLASSES[state.selectionLevel],
        }),
      );
    }
  }

  return DecorationSet.create(doc, decorations);
}

// --- Helpers ---

function hasActiveDiffAtPos(view: EditorView, pos: number): boolean {
  // Check for diff decorations at this position by looking for diff plugin state
  const diffPluginKey = new PluginKey('diffDecoration');
  const diffState = diffPluginKey.getState(view.state);
  if (!diffState?.diffs) return false;

  for (const diff of diffState.diffs) {
    if (diff.state !== 'pending') continue;
    const from = diff.position;
    const to = from + diff.originalText.length;
    if (pos >= from && pos < to) return true;
  }
  return false;
}

// --- Extension ---

export const MarkingExtension = Extension.create<MarkingExtensionOptions>({
  name: 'marking',

  addOptions() {
    return {
      onProvenanceEvent: undefined,
      onDragSelection: null,
    };
  },

  addProseMirrorPlugins() {
    const onDragSelection = this.options.onDragSelection ?? null;

    // Drag detection state (closure-scoped, not plugin state).
    // We measure the distance between mousedown and mouseup to distinguish
    // a drag-selection from a click (single, double, or triple).
    let mouseDownCoords: { x: number; y: number } | null = null;
    const MIN_DRAG_DISTANCE = 5;

    function getInitialState(): MarkingPluginState {
      return {
        selectionLevel: null,
        selectedRange: null,
        decorations: DecorationSet.empty,
      };
    }

    function hasTextAtPos(doc: ProseMirrorNode, pos: number): boolean {
      // Check if there's actual text content at or near this position
      if (doc.content.size === 0) return false;
      const resolved = doc.resolve(Math.min(pos, doc.content.size));
      const parent = resolved.parent;
      return parent.textContent.trim().length > 0;
    }

    return [
      new Plugin({
        key: markingPluginKey,

        state: {
          init(): MarkingPluginState {
            return getInitialState();
          },

          apply(tr, value, _oldState, newState): MarkingPluginState {
            // Check for explicit state update via meta
            const newPluginState = tr.getMeta(markingPluginKey);
            if (newPluginState) {
              const updated = {
                ...newPluginState,
                decorations: buildSelectionDecorations(
                  newPluginState,
                  newState.doc,
                ),
              };
              return updated;
            }

            // Map decorations through document changes
            if (tr.docChanged) {
              return {
                ...value,
                decorations: value.decorations.map(tr.mapping, tr.doc),
              };
            }

            return value;
          },
        },

        props: {
          decorations(state) {
            const pluginState = markingPluginKey.getState(state) as
              | MarkingPluginState
              | undefined;
            return pluginState?.decorations ?? DecorationSet.empty;
          },

          handleClick(view, pos, event) {
            // Ignore right-clicks
            if (event.button !== 0) return false;

            // Don't handle if editor is not editable
            if (!view.editable) return false;

            // Skip if there's an active diff at this position
            if (hasActiveDiffAtPos(view, pos)) return false;

            // Don't intercept clicks on empty paragraphs or non-text areas
            if (!hasTextAtPos(view.state.doc, pos)) return false;

            const doc = view.state.doc;
            const wordRange = getWordBoundary(doc, pos);

            // Verify the word range actually contains text
            const wordText = doc
              .textBetween(wordRange.from, wordRange.to, '', '')
              .trim();
            if (!wordText) return false;

            const newState: MarkingPluginState = {
              selectionLevel: 'word',
              selectedRange: wordRange,
              decorations: DecorationSet.empty,
            };
            newState.decorations = buildSelectionDecorations(newState, doc);

            view.dispatch(
              view.state.tr.setMeta(markingPluginKey, newState),
            );

            // Return false to allow default cursor placement alongside marking
            return false;
          },

          handleDoubleClick(view, pos) {
            if (!view.editable) return false;

            // Skip if there's an active diff at this position
            if (hasActiveDiffAtPos(view, pos)) return false;

            // Don't handle empty paragraphs or non-text areas
            if (!hasTextAtPos(view.state.doc, pos)) return false;

            const doc = view.state.doc;
            const phraseRange = getPhraseBoundary(doc, pos);

            // Verify the phrase range actually contains text
            const phraseText = doc
              .textBetween(phraseRange.from, phraseRange.to, '', '')
              .trim();
            if (!phraseText) return false;

            const newState: MarkingPluginState = {
              selectionLevel: 'phrase',
              selectedRange: phraseRange,
              decorations: DecorationSet.empty,
            };
            newState.decorations = buildSelectionDecorations(newState, doc);

            view.dispatch(
              view.state.tr.setMeta(markingPluginKey, newState),
            );

            // Prevent browser default word selection
            return true;
          },

          handleTripleClick(view, pos) {
            if (!view.editable) return false;

            // Skip if there's an active diff at this position
            if (hasActiveDiffAtPos(view, pos)) return false;

            // Don't handle empty paragraphs or non-text areas
            if (!hasTextAtPos(view.state.doc, pos)) return false;

            const doc = view.state.doc;
            const sentenceRange = getSentenceBoundary(doc, pos);

            // Verify the sentence range actually contains text
            const sentenceText = doc
              .textBetween(sentenceRange.from, sentenceRange.to, '', '')
              .trim();
            if (!sentenceText) return false;

            const newState: MarkingPluginState = {
              selectionLevel: 'sentence',
              selectedRange: sentenceRange,
              decorations: DecorationSet.empty,
            };
            newState.decorations = buildSelectionDecorations(newState, doc);

            view.dispatch(
              view.state.tr.setMeta(markingPluginKey, newState),
            );

            // Prevent browser default paragraph selection
            return true;
          },

          handleKeyDown(view, event) {
            if (event.key === 'Escape') {
              const pluginState = markingPluginKey.getState(
                view.state,
              ) as MarkingPluginState;
              if (pluginState?.selectedRange) {
                view.dispatch(
                  view.state.tr.setMeta(
                    markingPluginKey,
                    getInitialState(),
                  ),
                );
                return true;
              }
            }

            return false;
          },

          handleDOMEvents: {
            mousedown: (_view: EditorView, event: Event) => {
              const e = event as MouseEvent;
              mouseDownCoords = { x: e.clientX, y: e.clientY };
              return false;
            },

            mouseup: (view: EditorView, event: Event) => {
              const e = event as MouseEvent;

              if (!mouseDownCoords || !onDragSelection) {
                mouseDownCoords = null;
                return false;
              }

              const dx = e.clientX - mouseDownCoords.x;
              const dy = e.clientY - mouseDownCoords.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              mouseDownCoords = null;

              // Mouse barely moved — this is a click, not a drag
              if (distance < MIN_DRAG_DISTANCE) return false;
              if (!view.editable) return false;

              // Defer to let ProseMirror sync the selection after the drag
              setTimeout(() => {
                if (!view.dom.isConnected) return;

                const { from, to } = view.state.selection;
                if (from === to) return;

                const text = view.state.doc.textBetween(from, to, ' ');
                if (text.length < 2) return;

                // Get the bounding rect of the browser selection
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const rect = sel.getRangeAt(0).getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) return;

                // Build surrounding context (~200 chars before and after)
                const docSize = view.state.doc.content.size;
                const contextStart = Math.max(0, from - 200);
                const contextEnd = Math.min(docSize, to + 200);
                const context = view.state.doc.textBetween(
                  contextStart,
                  contextEnd,
                  ' ',
                );

                onDragSelection({ from, to, text, context, rect });
              }, 0);

              return false;
            },
          },
        },
      }),
    ];
  },
});

// --- Helper: Get current marking state ---

export function getMarkingState(
  view: EditorView,
): MarkingPluginState | null {
  return (
    (markingPluginKey.getState(view.state) as MarkingPluginState) ?? null
  );
}

// --- Helper: Clear selection ---

export function clearMarkingSelection(view: EditorView): void {
  const pluginState = markingPluginKey.getState(
    view.state,
  ) as MarkingPluginState;
  if (pluginState) {
    view.dispatch(
      view.state.tr.setMeta(markingPluginKey, {
        ...pluginState,
        selectedRange: null,
        selectionLevel: null,
        decorations: DecorationSet.empty,
      }),
    );
  }
}
