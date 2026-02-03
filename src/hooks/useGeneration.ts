import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorStore } from '@/stores/useEditorStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useProvenanceStore } from '@/stores/useProvenanceStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { updateDiffs } from '@/extensions/DiffDecorationPlugin';
import { forceExitEditMode } from '@/extensions/MarkingExtension';
import type { EventType } from '@/types';
import {
  scanDocument,
  buildRequest,
  buildPromptBarRequest,
  callGenerateAPI,
  GenerationError,
} from '@/services/generation';

// --- Types ---

export type GenerationStatus = 'idle' | 'loading' | 'error' | 'complete';

export interface GenerationState {
  status: GenerationStatus;
  error: string | null;
  retryable: boolean;
}

// --- Helpers ---

function logProvenance(type: EventType, data: Record<string, unknown>) {
  const event = useProvenanceStore.getState().logEvent(type, data);
  useSessionStore.getState().addProvenanceEvent(event);
}

// --- Hook ---

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    error: null,
    retryable: false,
  });

  /**
   * Execute the regeneration flow: scan document, call API, apply diffs.
   * Used by the Regenerate button.
   */
  const regenerate = useCallback(async (editor: Editor, goal: string) => {
    // Exit edit mode if active
    forceExitEditMode(editor.view);

    setState({ status: 'loading', error: null, retryable: false });
    useLoadingStore.getState().startGeneration();
    useEditorStore.getState().setReadOnly(true);

    try {
      // Scan document for gaps and constraints
      const scan = scanDocument(editor);

      if (scan.gaps.length === 0) {
        setState({ status: 'idle', error: null, retryable: false });
        useLoadingStore.getState().stopGeneration();
        useEditorStore.getState().setReadOnly(false);
        return;
      }

      // Log request provenance
      logProvenance('ai-generation-requested', {
        gapCount: scan.gaps.length,
        constraintCount: scan.constraints.length,
        mode: 'regenerate',
      });

      // Build request and call API
      const request = buildRequest(goal, scan, 'regenerate');
      const response = await callGenerateAPI(request);

      // Apply gap fills as diffs
      for (const gapFill of response.gaps) {
        const matchingGap = scan.gaps.find((g) => g.id === gapFill.id);
        if (matchingGap) {
          useEditorStore.getState().addDiff(
            matchingGap.originalText,
            gapFill.text,
            matchingGap.position.from,
          );
        }
      }

      // Update diff decorations
      const activeDiffs = useEditorStore.getState().getActiveDiffs();
      updateDiffs(editor, activeDiffs);

      // Log response provenance
      logProvenance('ai-generation-received', {
        gapCount: response.gaps.length,
        mode: 'regenerate',
      });

      setState({ status: 'complete', error: null, retryable: false });
    } catch (err) {
      const message = err instanceof GenerationError
        ? err.message
        : 'An unexpected error occurred. Please try again.';
      const retryable = err instanceof GenerationError ? err.retryable : true;

      setState({ status: 'error', error: message, retryable });
    } finally {
      useLoadingStore.getState().stopGeneration();
      useEditorStore.getState().setReadOnly(false);
    }
  }, []);

  /**
   * Execute a prompt bar request: selection replacement or cursor continuation.
   * Used by the PromptBar component.
   */
  const promptRequest = useCallback(async (
    editor: Editor,
    goal: string,
    promptText: string,
  ) => {
    // Exit edit mode if active
    forceExitEditMode(editor.view);

    const { selection } = editor.state;
    const mode = selection.empty ? 'continuation' : 'selection';

    setState({ status: 'loading', error: null, retryable: false });
    useLoadingStore.getState().startGeneration();
    useEditorStore.getState().setReadOnly(true);

    try {
      const request = buildPromptBarRequest(editor, goal, promptText, mode);

      // Log provenance
      logProvenance('ai-generation-requested', {
        mode,
        userRequest: promptText,
        selectionFrom: selection.from,
        selectionTo: selection.to,
      });

      const response = await callGenerateAPI(request);

      if (mode === 'selection' && response.gaps.length > 0) {
        // Apply as diff for selection mode
        const gap = request.gaps[0];
        const gapFill = response.gaps[0];
        useEditorStore.getState().addDiff(
          gap.originalText,
          gapFill.text,
          gap.position.from,
        );
        const activeDiffs = useEditorStore.getState().getActiveDiffs();
        updateDiffs(editor, activeDiffs);
      } else if (mode === 'continuation' && response.gaps.length > 0) {
        // Insert text at cursor position for continuation mode
        const gapFill = response.gaps[0];
        const cursorPos = selection.from;

        // Insert as ai-generated text
        const { tr } = editor.state;
        tr.insertText(gapFill.text, cursorPos);

        // Apply ai-generated mark to the inserted text
        const markType = editor.schema.marks.textState;
        if (markType) {
          tr.addMark(
            cursorPos,
            cursorPos + gapFill.text.length,
            markType.create({ state: 'ai-generated' }),
          );
        }
        editor.view.dispatch(tr);
      }

      // Log response provenance
      logProvenance('ai-generation-received', {
        mode,
        gapCount: response.gaps.length,
        userRequest: promptText,
      });

      setState({ status: 'complete', error: null, retryable: false });
    } catch (err) {
      const message = err instanceof GenerationError
        ? err.message
        : 'An unexpected error occurred. Please try again.';
      const retryable = err instanceof GenerationError ? err.retryable : true;

      setState({ status: 'error', error: message, retryable });
    } finally {
      useLoadingStore.getState().stopGeneration();
      useEditorStore.getState().setReadOnly(false);
    }
  }, []);

  /**
   * Clear the error state and return to idle.
   */
  const clearError = useCallback(() => {
    setState({ status: 'idle', error: null, retryable: false });
  }, []);

  return {
    ...state,
    regenerate,
    promptRequest,
    clearError,
  };
}
