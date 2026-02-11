import { create } from 'zustand';
import type { SelectedSegment } from '@/types/contribution';
import type { Dimension } from '@/types/contribution';

// --- Types ---

interface InspectState {
  isInspectMode: boolean;
  isHighlightMode: boolean;
  selectedSegment: SelectedSegment | null;
  hoveredDimension: Dimension | null;
}

interface InspectActions {
  toggleInspectMode: () => void;
  toggleHighlightMode: () => void;
  setSelectedSegment: (segment: SelectedSegment) => void;
  clearSelectedSegment: () => void;
  setHoveredDimension: (dim: Dimension | null) => void;
  clearHoveredDimension: () => void;
}

type InspectStore = InspectState & InspectActions;

// --- Store ---

export const useInspectStore = create<InspectStore>()((set) => ({
  isInspectMode: false,
  isHighlightMode: false,
  selectedSegment: null,
  hoveredDimension: null,

  toggleInspectMode: () => {
    set((state) => ({
      isInspectMode: !state.isInspectMode,
      selectedSegment: !state.isInspectMode ? state.selectedSegment : null,
      hoveredDimension: !state.isInspectMode ? state.hoveredDimension : null,
    }));
  },

  toggleHighlightMode: () => {
    set((state) => ({ isHighlightMode: !state.isHighlightMode }));
  },

  setSelectedSegment: (segment) => {
    set({ selectedSegment: segment });
  },

  clearSelectedSegment: () => {
    set({ selectedSegment: null });
  },

  setHoveredDimension: (dim) => {
    set({ hoveredDimension: dim });
  },

  clearHoveredDimension: () => {
    set({ hoveredDimension: null });
  },
}));
