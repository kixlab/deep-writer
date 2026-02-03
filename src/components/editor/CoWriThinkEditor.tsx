'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStateExtension } from '@/extensions/TextStateExtension';
import { ProvenancePlugin } from '@/extensions/ProvenancePlugin';
import {
  DiffDecorationPlugin,
  updateDiffs,
} from '@/extensions/DiffDecorationPlugin';
import { MarkingExtension } from '@/extensions/MarkingExtension';
import type { DragSelectionData } from '@/extensions/MarkingExtension';
import { AlternativesTooltip } from '@/components/editor/AlternativesTooltip';
import { useEditorStore } from '@/stores/useEditorStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useProvenanceStore } from '@/stores/useProvenanceStore';
import { useSessionStore } from '@/stores/useSessionStore';
import type { EventType } from '@/types';

// --- Types ---

export interface CoWriThinkEditorHandle {
  getEditor: () => Editor | null;
}

interface CoWriThinkEditorProps {
  initialContent?: JSONContent | string;
  onUpdate?: (content: string) => void;
  className?: string;
}

// --- Stable Callback Refs ---

// These functions access store state at call time via getState(),
// avoiding stale closure issues with TipTap's one-time extension capture.

function handleProvenanceEvent(
  type: EventType,
  data: Record<string, unknown>,
) {
  const event = useProvenanceStore.getState().logEvent(type, data);
  useSessionStore.getState().addProvenanceEvent(event);
}

// Module-level mutable ref for drag-selection tooltip.
// TipTap captures extension options once, so the callback must be stable.
// This mirrors the handleProvenanceEvent pattern above.
let _setTooltipData: ((data: DragSelectionData | null) => void) | null = null;

function handleDragSelection(data: DragSelectionData) {
  _setTooltipData?.(data);
}

function dismissTooltip() {
  _setTooltipData?.(null);
}

// --- Component ---

export const CoWriThinkEditor = forwardRef<CoWriThinkEditorHandle, CoWriThinkEditorProps>(
  function CoWriThinkEditor(
    { initialContent = '', onUpdate, className = '' },
    ref,
  ) {
    const isReadOnly = useEditorStore((s) => s.isReadOnly);
    const isGenerating = useLoadingStore((s) => s.isGenerating);
    const activeDiffs = useEditorStore((s) => s.activeDiffs);
    const sessionGoal = useSessionStore((s) => s.session?.goal ?? '');
    const editorRef = useRef<ReturnType<typeof useEditor>>(null);

    // Drag-selection tooltip state
    const [tooltipData, setTooltipData] = useState<DragSelectionData | null>(null);
    const handleTooltipDismiss = useCallback(() => {
      setTooltipData(null);
    }, []);

    // Diff interaction handler using getState() for fresh store access
    const handleDiffInteraction = useRef(
      (diffId: string, action: 'accept' | 'reject' | 'restore') => {
        useEditorStore.getState().resolveDiff(diffId, action);
        const event = useProvenanceStore.getState().logEvent('diff-resolved', {
          diffId,
          action,
        });
        useSessionStore.getState().addProvenanceEvent(event);

        // Immediately update decorations with remaining pending diffs
        if (editorRef.current) {
          const pendingDiffs = useEditorStore.getState().getActiveDiffs();
          updateDiffs(editorRef.current, pendingDiffs);
        }
      },
    );

    const editor = useEditor({
      extensions: [
        StarterKit,
        TextStateExtension,
        ProvenancePlugin.configure({
          onProvenanceEvent: handleProvenanceEvent,
        }),
        DiffDecorationPlugin.configure({
          onDiffInteraction: (diffId, action) =>
            handleDiffInteraction.current(diffId, action),
        }),
        MarkingExtension.configure({
          onProvenanceEvent: handleProvenanceEvent,
          onDragSelection: handleDragSelection,
        }),
      ],
      content: initialContent,
      editable: !isReadOnly && !isGenerating,
      onUpdate: ({ editor: ed }) => {
        // Persist document state to session store
        useSessionStore.getState().updateDocumentState(ed.getJSON());
        // Dismiss drag-selection tooltip when document content changes
        dismissTooltip();
        // Call external callback if provided
        onUpdate?.(ed.getHTML());
      },
    });

    // Keep editor ref in sync
    useEffect(() => {
      editorRef.current = editor;
    }, [editor]);

    // Wire up the module-level tooltip callback so the MarkingExtension
    // can set React state even though TipTap captured options once.
    useEffect(() => {
      _setTooltipData = setTooltipData;
      return () => {
        _setTooltipData = null;
      };
    }, []);

    // Expose editor instance to parent via ref
    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }), [editor]);

    // Sync decoration state when activeDiffs change externally
    useEffect(() => {
      if (!editor) return;
      const pendingDiffs = activeDiffs.filter((d) => d.state === 'pending');
      updateDiffs(editor, pendingDiffs);
    }, [editor, activeDiffs]);

    return (
      <div
        className={`flex-1 text-gray-900 dark:text-gray-100 ${className}`}
      >
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none dark:prose-invert focus:outline-none"
        />
        {tooltipData && editor && (
          <AlternativesTooltip
            selectionRect={tooltipData.rect}
            selectedText={tooltipData.text}
            context={tooltipData.context}
            goal={sessionGoal}
            onReplace={(alternative) => {
              editor.chain().focus().insertContentAt(
                { from: tooltipData.from, to: tooltipData.to },
                alternative,
              ).run();
              setTooltipData(null);
            }}
            onDismiss={handleTooltipDismiss}
          />
        )}
      </div>
    );
  },
);
