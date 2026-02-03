'use client';

import { GoalDisplay } from '@/components/goal/GoalDisplay';
import { ExportButton } from '@/components/shared/ExportButton';

// --- Types ---

interface AppHeaderProps {
  goal?: string;
  onGoalEdit?: () => void;
}

// --- Component ---

export function AppHeader({ goal, onGoalEdit }: AppHeaderProps) {
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
          <ExportButton />
        </div>
      </div>
    </header>
  );
}
