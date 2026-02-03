import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '../useLayoutStore';

// --- Helpers ---

function resetStore() {
  useLayoutStore.setState({ isSidePanelOpen: true });
}

// --- Tests ---

describe('useLayoutStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should have isSidePanelOpen as true', () => {
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(true);
    });
  });

  describe('toggleSidePanel', () => {
    it('should toggle from true to false', () => {
      useLayoutStore.getState().toggleSidePanel();
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(false);
    });

    it('should toggle from false to true', () => {
      useLayoutStore.getState().toggleSidePanel(); // true -> false
      useLayoutStore.getState().toggleSidePanel(); // false -> true
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(true);
    });

    it('should toggle multiple times correctly', () => {
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(true);

      useLayoutStore.getState().toggleSidePanel();
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(false);

      useLayoutStore.getState().toggleSidePanel();
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(true);

      useLayoutStore.getState().toggleSidePanel();
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(false);
    });
  });

  describe('setSidePanelOpen', () => {
    it('should set to false directly', () => {
      useLayoutStore.getState().setSidePanelOpen(false);
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(false);
    });

    it('should set to true directly', () => {
      useLayoutStore.getState().setSidePanelOpen(false);
      useLayoutStore.getState().setSidePanelOpen(true);
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(true);
    });

    it('should be idempotent when setting same value', () => {
      useLayoutStore.getState().setSidePanelOpen(true);
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(true);

      useLayoutStore.getState().setSidePanelOpen(false);
      useLayoutStore.getState().setSidePanelOpen(false);
      expect(useLayoutStore.getState().isSidePanelOpen).toBe(false);
    });
  });
});
