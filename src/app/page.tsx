'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { CoWriThinkEditor } from '@/components/editor/CoWriThinkEditor';
import { SkeletonPlaceholder } from '@/components/editor/SkeletonPlaceholder';
import { PromptBar } from '@/components/editor/PromptBar';
import { StorageWarning } from '@/components/shared/StorageWarning';

// --- Types ---

type AppState = 'loading' | 'goal-prompt' | 'mode-select' | 'editor';

// --- Component ---

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [goal, setGoal] = useState('');

  const session = useSessionStore((s) => s.session);
  const initSession = useSessionStore((s) => s.initSession);
  const loadFromStorage = useSessionStore((s) => s.loadFromStorage);
  const isGenerating = useLoadingStore((s) => s.isGenerating);

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
    // TODO: Actual AI generation is SPEC-CORE-002 scope.
    // For now, just open the editor. The generation flow will be
    // wired in when the AI service layer is implemented.
  }, [goal, initSession]);

  // Goal edit handler (from header)
  const handleGoalEdit = useCallback(() => {
    // Scroll to the SidePanelGoal section or trigger edit mode
    // For now, this is a no-op placeholder. The side panel goal
    // section has its own edit button for direct editing.
  }, []);

  // Prompt submit handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePromptSubmit = useCallback((_prompt: string) => {
    // TODO: Wire to AI service in SPEC-CORE-002
  }, []);

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

  // Editor state
  return (
    <div className="flex h-screen flex-col">
      <AppHeader goal={session?.goal} onGoalEdit={handleGoalEdit} />
      <SplitLayout
        editor={
          <div className="flex h-full flex-col">
            <div className="px-4 pt-2">
              <StorageWarning />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isGenerating && <SkeletonPlaceholder />}
              <CoWriThinkEditor
                initialContent={session?.documentState ?? ''}
              />
            </div>
            <PromptBar onSubmit={handlePromptSubmit} />
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
