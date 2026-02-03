import { Mark, mergeAttributes } from '@tiptap/core';
import type { TextState } from '@/types';

// --- Text State CSS Classes ---

const TEXT_STATE_CLASSES: Record<TextState, string> = {
  'user-written': '',
  'ai-generated': 'bg-green-100 dark:bg-green-900/30',
  'ai-pending': 'bg-green-200 dark:bg-green-800/40',
  'user-edited':
    'underline decoration-blue-300 decoration-2 underline-offset-2',
  'marked-preserve': 'bg-green-200 dark:bg-green-800/50 ring-1 ring-green-400',
  'marked-delete':
    'line-through decoration-red-500 decoration-2 bg-red-50 dark:bg-red-900/20',
  'original-removed':
    'line-through decoration-red-400 decoration-2 bg-red-100 dark:bg-red-900/30 opacity-70',
};

/**
 * Returns Tailwind CSS classes for the given text state.
 */
export function getTextStateClass(state: TextState): string {
  return TEXT_STATE_CLASSES[state] ?? '';
}

// --- TipTap Command Type Augmentation ---

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textState: {
      /**
       * Apply a text state mark to the current selection.
       */
      setTextState: (state: TextState) => ReturnType;
      /**
       * Remove text state mark from the current selection.
       */
      unsetTextState: () => ReturnType;
      /**
       * Toggle a text state mark on the current selection.
       */
      toggleTextState: (state: TextState) => ReturnType;
    };
  }
}

// --- TextState Mark Extension ---

export const TextStateExtension = Mark.create({
  name: 'textState',

  addAttributes() {
    return {
      state: {
        default: 'user-written',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-text-state') || 'user-written',
        renderHTML: (attributes: Record<string, unknown>) => {
          const state = attributes.state as TextState;
          return {
            'data-text-state': state,
            class: getTextStateClass(state),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-text-state]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setTextState:
        (state: TextState) =>
        ({ commands }) => {
          return commands.setMark(this.name, { state });
        },

      unsetTextState:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },

      toggleTextState:
        (state: TextState) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, { state });
        },
    };
  },
});
