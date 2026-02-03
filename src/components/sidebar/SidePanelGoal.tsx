'use client';

import { useState } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';
import { useProvenanceStore } from '@/stores/useProvenanceStore';

// --- Component ---

export function SidePanelGoal() {
  const session = useSessionStore((s) => s.session);
  const updateGoal = useSessionStore((s) => s.updateGoal);
  const logEvent = useProvenanceStore((s) => s.logEvent);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  if (!session) return null;

  const handleStartEdit = () => {
    setEditValue(session.goal);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== session.goal) {
      const previousGoal = session.goal;
      updateGoal(trimmed, 'manual');
      logEvent('goal-changed', {
        previousGoal,
        newGoal: trimmed,
        source: 'manual',
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Goal
        </h3>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Edit goal"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Edit goal text"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {session.goal}
        </p>
      )}
    </div>
  );
}
