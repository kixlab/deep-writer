'use client';

import { useState, useRef, useEffect } from 'react';

// --- Types ---

interface GoalModalProps {
  onSubmit: (goal: string) => void;
}

// --- Component ---

export function GoalModal({ onSubmit }: GoalModalProps) {
  const [goal, setGoal] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = goal.trim();
    if (!trimmed) {
      setValidationMessage('Please enter a writing goal to continue.');
      return;
    }
    setValidationMessage('');
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGoal(e.target.value);
    if (validationMessage) {
      setValidationMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          What are you writing?
        </h1>

        <textarea
          ref={textareaRef}
          value={goal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="An argumentative essay about whether AI should be used in education..."
          rows={4}
          className="mb-2 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-4 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          aria-label="Writing goal"
        />

        {validationMessage && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {validationMessage}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!goal.trim()}
          className="mt-2 w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
          aria-label="Set Goal"
        >
          Set Goal
        </button>
      </div>
    </div>
  );
}
