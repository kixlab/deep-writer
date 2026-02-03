import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { DiffEntry } from '@/types';

// --- Plugin Key (shared between plugin and updateDiffs helper) ---

const diffDecorationPluginKey = new PluginKey('diffDecoration');

// --- Types ---

export interface DiffDecorationPluginOptions {
  onDiffInteraction?: (
    diffId: string,
    action: 'accept' | 'reject' | 'restore',
  ) => void;
}

interface DiffPluginState {
  diffs: DiffEntry[];
  decorations: DecorationSet;
}

// --- Widget Factory ---

function createReplacementWidget(
  diff: DiffEntry,
  onInteraction?: DiffDecorationPluginOptions['onDiffInteraction'],
): HTMLElement {
  const span = document.createElement('span');
  span.className = 'diff-replacement';
  span.textContent = diff.replacementText;
  span.title = 'Click to reject AI replacement';
  span.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    onInteraction?.(diff.id, 'reject');
  });
  return span;
}

// --- Decoration Builder ---

function buildDecorations(
  diffs: DiffEntry[],
  doc: ProseMirrorNode,
  onInteraction?: DiffDecorationPluginOptions['onDiffInteraction'],
): DecorationSet {
  const decorations: Decoration[] = [];

  for (const diff of diffs) {
    if (diff.state !== 'pending') continue;

    const from = diff.position;
    const to = from + diff.originalText.length;

    // Validate positions against document size
    if (from < 0 || to > doc.content.size) continue;

    // Inline decoration for original text (strikethrough, red)
    decorations.push(
      Decoration.inline(from, to, {
        class: 'diff-original',
        nodeName: 'span',
      }),
    );

    // Widget decoration for replacement text (green)
    decorations.push(
      Decoration.widget(
        to,
        createReplacementWidget(diff, onInteraction),
        {
          side: 1,
          ignoreSelection: true,
          stopEvent: () => true,
        },
      ),
    );
  }

  return DecorationSet.create(doc, decorations);
}

// --- Extension ---

export const DiffDecorationPlugin = Extension.create<DiffDecorationPluginOptions>(
  {
    name: 'diffDecoration',

    addOptions() {
      return {
        onDiffInteraction: undefined,
      };
    },

    addProseMirrorPlugins() {
      const extensionOptions = this.options;

      return [
        new Plugin({
          key: diffDecorationPluginKey,

          state: {
            init(): DiffPluginState {
              return {
                diffs: [],
                decorations: DecorationSet.empty,
              };
            },

            apply(tr, value, _oldState, newState): DiffPluginState {
              const diffUpdate = tr.getMeta(diffDecorationPluginKey);
              if (diffUpdate) {
                return {
                  diffs: diffUpdate.diffs,
                  decorations: buildDecorations(
                    diffUpdate.diffs,
                    newState.doc,
                    extensionOptions.onDiffInteraction,
                  ),
                };
              }

              // Map existing decorations through document changes
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
              const pluginState = diffDecorationPluginKey.getState(state) as
                | DiffPluginState
                | undefined;
              return pluginState?.decorations ?? DecorationSet.empty;
            },

            handleClick(view, pos) {
              const pluginState = diffDecorationPluginKey.getState(
                view.state,
              ) as DiffPluginState | undefined;
              if (!pluginState?.diffs) return false;

              for (const diff of pluginState.diffs) {
                if (diff.state !== 'pending') continue;
                const from = diff.position;
                const to = from + diff.originalText.length;
                if (pos >= from && pos < to) {
                  extensionOptions.onDiffInteraction?.(diff.id, 'restore');
                  return true;
                }
              }

              return false;
            },
          },
        }),
      ];
    },
  },
);

// --- Helper: Dispatch diff updates to the plugin ---

export function updateDiffs(editor: Editor, diffs: DiffEntry[]): void {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(diffDecorationPluginKey, { diffs }),
  );
}
