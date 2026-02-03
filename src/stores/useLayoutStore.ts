import { create } from 'zustand';

// --- Types ---

interface LayoutState {
  isSidePanelOpen: boolean;
}

interface LayoutActions {
  toggleSidePanel: () => void;
  setSidePanelOpen: (open: boolean) => void;
}

type LayoutStore = LayoutState & LayoutActions;

// --- Store ---

export const useLayoutStore = create<LayoutStore>()((set) => ({
  isSidePanelOpen: true,

  toggleSidePanel: () => {
    set((state) => ({ isSidePanelOpen: !state.isSidePanelOpen }));
  },

  setSidePanelOpen: (open: boolean) => {
    set({ isSidePanelOpen: open });
  },
}));
