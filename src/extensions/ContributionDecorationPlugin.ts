import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { useContributionGraphStore } from '@/stores/useContributionGraphStore';
import type { Dimension } from '@/types/contribution';

// --- Plugin Key ---

const contributionDecorationPluginKey = new PluginKey('contributionDecoration');

// --- Types ---

export type ScoreAccessor = (roundId: string, dimension: 'd1' | 'd2' | 'd3') => number;

interface ContributionPluginState {
  isActive: boolean;
  scoreAccessor: ScoreAccessor | null;
  decorations: DecorationSet;
  hoveredDimension: Dimension | null;
}

// --- Constants ---

const LEVEL_CLASSES: Record<number, string> = {
  1: 'contribution-level-1',
  2: 'contribution-level-2',
  3: 'contribution-level-3',
  4: 'contribution-level-4',
  5: 'contribution-level-5',
};

const DIMENSION_LEVEL_CLASSES: Record<Dimension, Record<number, string>> = {
  d1: {
    1: 'dimension-d1-level-1',
    2: 'dimension-d1-level-2',
    3: 'dimension-d1-level-3',
    4: 'dimension-d1-level-4',
    5: 'dimension-d1-level-5',
  },
  d2: {
    1: 'dimension-d2-level-1',
    2: 'dimension-d2-level-2',
    3: 'dimension-d2-level-3',
    4: 'dimension-d2-level-4',
    5: 'dimension-d2-level-5',
  },
  d3: {
    1: 'dimension-d3-level-1',
    2: 'dimension-d3-level-2',
    3: 'dimension-d3-level-3',
    4: 'dimension-d3-level-4',
    5: 'dimension-d3-level-5',
  },
};

// --- Helpers ---

function scoreToLevel(score: number): number {
  if (score >= 0.80) return 5;
  if (score >= 0.60) return 4;
  if (score >= 0.40) return 3;
  if (score >= 0.20) return 2;
  return 1;
}

// --- Decoration Builder ---

function buildContributionDecorations(
  doc: ProseMirrorNode,
  scoreAccessor: ScoreAccessor,
  hoveredDimension?: Dimension | null,
): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return;

    const textStateMark = node.marks.find((m) => m.type.name === 'textState');
    const roundId: string | null | undefined = textStateMark?.attrs?.roundId;

    let level: number;

    if (!textStateMark || (textStateMark.attrs.state === 'user-written' && !roundId)) {
      level = 5;
    } else if (!roundId) {
      level = 5;
    } else {
      const roundNode = useContributionGraphStore.getState().getNode(roundId);
      const isAlternative = roundNode?.metadata.type === 'alternative';

      if (isAlternative && !hoveredDimension) {
        decorations.push(
          Decoration.inline(pos, pos + node.nodeSize, {
            class: 'contribution-alternative',
          }),
        );
        return;
      }

      if (hoveredDimension) {
        // Use single dimension score
        const singleScore = scoreAccessor(roundId, hoveredDimension);
        level = scoreToLevel(singleScore);
      } else {
        const d1 = scoreAccessor(roundId, 'd1');
        const d2 = scoreAccessor(roundId, 'd2');
        const d3 = scoreAccessor(roundId, 'd3');
        const composite = 0.35 * d1 + 0.40 * d2 + 0.25 * d3;
        level = scoreToLevel(composite);
      }
    }

    // Use dimension-specific classes when a dimension is hovered
    const cssClass = hoveredDimension
      ? DIMENSION_LEVEL_CLASSES[hoveredDimension][level]
      : LEVEL_CLASSES[level];

    decorations.push(
      Decoration.inline(pos, pos + node.nodeSize, {
        class: cssClass,
      }),
    );
  });

  return DecorationSet.create(doc, decorations);
}

// --- Extension ---

export const ContributionDecorationPlugin = Extension.create({
  name: 'contributionDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: contributionDecorationPluginKey,

        state: {
          init(): ContributionPluginState {
            return {
              isActive: false,
              scoreAccessor: null,
              decorations: DecorationSet.empty,
              hoveredDimension: null,
            };
          },

          apply(tr, value: ContributionPluginState, _oldState, newState): ContributionPluginState {
            const meta = tr.getMeta(contributionDecorationPluginKey);

            if (meta) {
              const accessor = meta.scoreAccessor ?? value.scoreAccessor;

              // Handle hoveredDimension change
              if ('hoveredDimension' in meta && value.isActive) {
                const newHovered: Dimension | null = meta.hoveredDimension ?? null;
                const activeAccessor = accessor ?? value.scoreAccessor;
                return {
                  isActive: true,
                  scoreAccessor: activeAccessor,
                  hoveredDimension: newHovered,
                  decorations: activeAccessor
                    ? buildContributionDecorations(newState.doc, activeAccessor, newHovered)
                    : DecorationSet.empty,
                };
              }

              if (meta.isActive === true) {
                return {
                  isActive: true,
                  scoreAccessor: accessor,
                  hoveredDimension: value.hoveredDimension,
                  decorations: accessor
                    ? buildContributionDecorations(newState.doc, accessor, value.hoveredDimension)
                    : DecorationSet.empty,
                };
              }

              if (meta.isActive === false) {
                return {
                  isActive: false,
                  scoreAccessor: accessor,
                  hoveredDimension: null,
                  decorations: DecorationSet.empty,
                };
              }

              if (meta.scoresUpdated === true && value.isActive) {
                const activeAccessor = accessor ?? value.scoreAccessor;
                return {
                  isActive: true,
                  scoreAccessor: activeAccessor,
                  hoveredDimension: value.hoveredDimension,
                  decorations: activeAccessor
                    ? buildContributionDecorations(newState.doc, activeAccessor, value.hoveredDimension)
                    : DecorationSet.empty,
                };
              }
            }

            if (tr.docChanged && value.isActive) {
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
            const pluginState = contributionDecorationPluginKey.getState(state) as
              | ContributionPluginState
              | undefined;
            return pluginState?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

// --- Helpers ---

export function updateContributionOverlay(
  editor: Editor,
  isActive: boolean,
  scoreAccessor?: ScoreAccessor,
): void {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(contributionDecorationPluginKey, {
      isActive,
      scoreAccessor,
    }),
  );
}

export function refreshContributionScores(
  editor: Editor,
  scoreAccessor: ScoreAccessor,
): void {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(contributionDecorationPluginKey, {
      scoresUpdated: true,
      scoreAccessor,
    }),
  );
}

export function updateDimensionHover(
  editor: Editor,
  hoveredDimension: Dimension | null,
): void {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(contributionDecorationPluginKey, {
      hoveredDimension,
    }),
  );
}
