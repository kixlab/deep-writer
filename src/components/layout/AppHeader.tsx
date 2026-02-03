'use client';

import { GoalDisplay } from '@/components/goal/GoalDisplay';
import { ExportButton } from '@/components/shared/ExportButton';

// --- Types ---

interface AppHeaderProps {
  goal?: string;
  theme?: 'light' | 'dark';
  onGoalEdit?: () => void;
  onNewSession?: () => void;
  onToggleTheme?: () => void;
}

// --- Component ---

export function AppHeader({ goal, theme, onGoalEdit, onNewSession, onToggleTheme }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          CoWriThink
        </h1>

        {goal && (
          <div className="ml-4 flex-1">
            <GoalDisplay goal={goal} onEdit={onGoalEdit} />
          </div>
        )}

        <div className="ml-4 flex shrink-0 items-center gap-2">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          )}
          {onNewSession && (
            <button
              onClick={onNewSession}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              New Session
            </button>
          )}
          <ExportButton />
        </div>
      </div>
    </header>
  );
}
