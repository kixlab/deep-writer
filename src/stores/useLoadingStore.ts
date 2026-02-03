import { create } from 'zustand';

// --- Types ---

interface LoadingState {
  isGenerating: boolean;
  generationStartTime: number | null;
}

interface LoadingActions {
  startGeneration: () => void;
  stopGeneration: () => void;
  getElapsedTime: () => number | null;
}

type LoadingStore = LoadingState & LoadingActions;

// --- Store ---

export const useLoadingStore = create<LoadingStore>()((set, get) => ({
  isGenerating: false,
  generationStartTime: null,

  startGeneration: () => {
    set({ isGenerating: true, generationStartTime: Date.now() });
  },

  stopGeneration: () => {
    set({ isGenerating: false, generationStartTime: null });
  },

  getElapsedTime: (): number | null => {
    const { isGenerating, generationStartTime } = get();
    if (!isGenerating || generationStartTime === null) return null;
    return Date.now() - generationStartTime;
  },
}));
