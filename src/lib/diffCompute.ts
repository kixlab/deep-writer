import type { Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import type { DiffEntry } from '@/types';

// --- Types ---

export interface DiffHighlight {
  from: number;
  to: number;
}

export interface DiffViewData {
  originalDocJSON: Record<string, unknown>;
  modifiedDocJSON: Record<string, unknown>;
  originalHighlights: DiffHighlight[];
  modifiedHighlights: DiffHighlight[];
}

// --- Compute diff views for split panels ---

export function computeDiffViews(
  editorState: EditorState,
  pendingDiffs: DiffEntry[],
): DiffViewData {
  const originalDocJSON = editorState.doc.toJSON() as Record<string, unknown>;

  // Original highlights: positions of text that will be deleted
  const originalHighlights: DiffHighlight[] = pendingDiffs.map((diff) => ({
    from: diff.position,
    to: diff.position + diff.originalText.length,
  }));

  // Build modified document by applying all replacements via ProseMirror transaction
  const sorted = [...pendingDiffs].sort((a, b) => a.position - b.position);
  const { tr } = editorState;

  const modifiedHighlights: DiffHighlight[] = [];

  for (const diff of sorted) {
    const from = tr.mapping.map(diff.position);
    const to = tr.mapping.map(diff.position + diff.originalText.length);
    tr.insertText(diff.replacementText, from, to);
    modifiedHighlights.push({
      from,
      to: from + diff.replacementText.length,
    });
  }

  const modifiedState = editorState.apply(tr);
  const modifiedDocJSON = modifiedState.doc.toJSON() as Record<string, unknown>;

  return {
    originalDocJSON,
    modifiedDocJSON,
    originalHighlights,
    modifiedHighlights,
  };
}

// --- Apply all diffs to the real editor ---

export function applyAllDiffs(
  editor: Editor,
  pendingDiffs: DiffEntry[],
): void {
  const sorted = [...pendingDiffs].sort((a, b) => a.position - b.position);
  const { tr } = editor.state;
  const markType = editor.schema.marks.textState;

  for (const diff of sorted) {
    const from = tr.mapping.map(diff.position);
    const to = tr.mapping.map(diff.position + diff.originalText.length);
    tr.insertText(diff.replacementText, from, to);

    // Apply ai-generated mark to the replacement text
    if (markType) {
      tr.addMark(
        from,
        from + diff.replacementText.length,
        markType.create({ state: 'ai-generated' }),
      );
    }
  }

  editor.view.dispatch(tr);
}
