import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const flashHighlightPluginKey = new PluginKey('flashHighlight');

const FLASH_DURATION_MS = 1500;

interface FlashState {
  decorations: DecorationSet;
  timer: ReturnType<typeof setTimeout> | null;
}

export const FlashHighlightPlugin = Extension.create({
  name: 'flashHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: flashHighlightPluginKey,

        state: {
          init(): FlashState {
            return { decorations: DecorationSet.empty, timer: null };
          },

          apply(tr, value, _oldState, newState): FlashState {
            const flash = tr.getMeta(flashHighlightPluginKey) as
              | { from: number; to: number }
              | 'clear'
              | undefined;

            if (flash === 'clear') {
              if (value.timer) clearTimeout(value.timer);
              return { decorations: DecorationSet.empty, timer: null };
            }

            if (flash && typeof flash === 'object') {
              const { from, to } = flash;
              if (from >= 0 && to <= newState.doc.content.size && from < to) {
                const deco = Decoration.inline(from, to, {
                  class: 'flash-highlight-inline',
                });
                return {
                  decorations: DecorationSet.create(newState.doc, [deco]),
                  timer: value.timer,
                };
              }
            }

            if (tr.docChanged) {
              return {
                ...value,
                decorations: value.decorations.map(tr.mapping, tr.doc),
              };
            }

            return value;
          },
        },

        props: {
          decorations(state) {
            const pluginState = flashHighlightPluginKey.getState(state) as
              | FlashState
              | undefined;
            return pluginState?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

export function triggerFlashHighlight(editor: Editor, from: number, to: number): void {
  const { tr } = editor.view.state;
  tr.setMeta(flashHighlightPluginKey, { from, to });
  editor.view.dispatch(tr);

  // Auto-clear after animation
  setTimeout(() => {
    if (!editor.isDestroyed) {
      const clearTr = editor.view.state.tr;
      clearTr.setMeta(flashHighlightPluginKey, 'clear');
      editor.view.dispatch(clearTr);
    }
  }, FLASH_DURATION_MS);
}
