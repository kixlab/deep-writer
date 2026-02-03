'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { GoalModal } from '@/components/goal/GoalModal';
import { StartModeSelector } from '@/components/goal/StartModeSelector';
import { AppHeader } from '@/components/layout/AppHeader';
import { SplitLayout } from '@/components/layout/SplitLayout';
import { SidePanel } from '@/components/sidebar/SidePanel';
import { SidePanelGoal } from '@/components/sidebar/SidePanelGoal';
import { PushbackComments } from '@/components/sidebar/PushbackComments';
import { RoundHistory } from '@/components/sidebar/RoundHistory';
import { DocumentOutline } from '@/components/sidebar/DocumentOutline';
import {
  CoWriThinkEditor,
  type CoWriThinkEditorHandle,
} from '@/components/editor/CoWriThinkEditor';
import { SkeletonPlaceholder } from '@/components/editor/SkeletonPlaceholder';
import { PromptBar } from '@/components/editor/PromptBar';
import { RegenerateButton } from '@/components/editor/RegenerateButton';
import { StorageWarning } from '@/components/shared/StorageWarning';
import { useGeneration } from '@/hooks/useGeneration';

// --- Types ---

type AppState = 'loading' | 'goal-prompt' | 'mode-select' | 'editor';

// --- Component ---

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [goal, setGoal] = useState('');
  const editorHandleRef = useRef<CoWriThinkEditorHandle>(null);

  const session = useSessionStore((s) => s.session);
  const initSession = useSessionStore((s) => s.initSession);
  const loadFromStorage = useSessionStore((s) => s.loadFromStorage);
  const isGenerating = useLoadingStore((s) => s.isGenerating);

  const generation = useGeneration();

  // On mount, try to load session from localStorage
  useEffect(() => {
    const hasExisting = loadFromStorage();
    if (hasExisting) {
      setGoal(useSessionStore.getState().session?.goal ?? '');
      setAppState('editor');
    } else {
      setAppState('goal-prompt');
    }
  }, [loadFromStorage]);

  // Goal submission handler
  const handleGoalSubmit = useCallback((submittedGoal: string) => {
    setGoal(submittedGoal);
    setAppState('mode-select');
  }, []);

  // Start from scratch handler
  const handleStartFromScratch = useCallback(() => {
    initSession(goal);
    setAppState('editor');
  }, [goal, initSession]);

  // Generate first draft handler
  const handleGenerateFirstDraft = useCallback(() => {
    initSession(goal);
    setAppState('editor');
    // Trigger AI first-draft generation after editor mounts
    setTimeout(() => {
      const editor = editorHandleRef.current?.getEditor();
      if (editor) {
        const currentGoal = useSessionStore.getState().session?.goal ?? goal;
        generation.promptRequest(editor, currentGoal, 'Write a first draft based on the writing goal.');
      }
    }, 100);
  }, [goal, initSession, generation]);

  // Goal edit handler (from header)
  const handleGoalEdit = useCallback(() => {
    // Side panel goal section has its own edit button for direct editing
  }, []);

  // Regenerate handler
  const handleRegenerate = useCallback(() => {
    const editor = editorHandleRef.current?.getEditor();
    if (!editor) return;
    const currentGoal = useSessionStore.getState().session?.goal ?? goal;
    generation.regenerate(editor, currentGoal);
  }, [goal, generation]);

  // Prompt submit handler
  const handlePromptSubmit = useCallback((prompt: string) => {
    const editor = editorHandleRef.current?.getEditor();
    if (!editor) return;
    const currentGoal = useSessionStore.getState().session?.goal ?? goal;
    generation.promptRequest(editor, currentGoal, prompt);
  }, [goal, generation]);

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Goal prompt state
  if (appState === 'goal-prompt') {
    return <GoalModal onSubmit={handleGoalSubmit} />;
  }

  // Mode select state
  if (appState === 'mode-select') {
    return (
      <StartModeSelector
        goal={goal}
        onStartFromScratch={handleStartFromScratch}
        onGenerateFirstDraft={handleGenerateFirstDraft}
      />
    );
  }

  // Get editor instance for components that need it
  const editorInstance = editorHandleRef.current?.getEditor() ?? null;

  // Editor state
  return (
    <div className="flex h-screen flex-col">
      <AppHeader goal={session?.goal} onGoalEdit={handleGoalEdit} />
      {generation.error && (
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <span>{generation.error}</span>
          <button
            onClick={generation.clearError}
            className="ml-2 text-red-500 underline hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}
      <SplitLayout
        editor={
          <div className="flex h-full flex-col">
            <div className="px-4 pt-2">
              <StorageWarning />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isGenerating && <SkeletonPlaceholder />}
              <CoWriThinkEditor
                ref={editorHandleRef}
                initialContent={session?.documentState ?? ''}
              />
            </div>
            <RegenerateButton
              editor={editorInstance}
              onRegenerate={handleRegenerate}
            />
            <PromptBar
              editor={editorInstance}
              goal={session?.goal}
              onSubmit={handlePromptSubmit}
            />
          </div>
        }
        sidePanel={
          <SidePanel>
            <SidePanelGoal />
            <PushbackComments />
            <RoundHistory />
            <DocumentOutline />
          </SidePanel>
        }
      />
    </div>
  );
}
