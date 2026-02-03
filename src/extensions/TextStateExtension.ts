import { Mark, mergeAttributes } from '@tiptap/core';
import type { TextState } from '@/types';

// --- Text State CSS Classes ---

const TEXT_STATE_CLASSES: Record<TextState, string> = {
  'user-written': '',
  'ai-generated': 'bg-green-50 dark:bg-green-500/10',
  'ai-pending': 'bg-green-100 dark:bg-green-400/15',
  'user-edited':
    'underline decoration-blue-300 dark:decoration-blue-400 decoration-2 underline-offset-2',
  'marked-preserve': 'bg-green-100 dark:bg-green-400/20 ring-1 ring-green-400 dark:ring-green-500',
  'marked-delete':
    'bg-red-100 text-red-800/80 dark:bg-red-500/20 dark:text-red-300/80',
  'original-removed':
    'bg-red-50 text-gray-400 dark:bg-red-500/10 dark:text-gray-500',
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
