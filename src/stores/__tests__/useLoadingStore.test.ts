import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLoadingStore } from '../useLoadingStore';

// --- Helpers ---

function resetStore() {
  useLoadingStore.setState({
    isGenerating: false,
    generationStartTime: null,
  });
}

// --- Tests ---

describe('useLoadingStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should have isGenerating as false', () => {
      expect(useLoadingStore.getState().isGenerating).toBe(false);
    });

    it('should have generationStartTime as null', () => {
      expect(useLoadingStore.getState().generationStartTime).toBeNull();
    });
  });

  describe('startGeneration', () => {
    it('should set isGenerating to true', () => {
      useLoadingStore.getState().startGeneration();
      expect(useLoadingStore.getState().isGenerating).toBe(true);
    });

    it('should set generationStartTime to current timestamp', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      useLoadingStore.getState().startGeneration();

      expect(useLoadingStore.getState().generationStartTime).toBe(now);

      vi.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('stopGeneration', () => {
    it('should set isGenerating to false', () => {
      useLoadingStore.getState().startGeneration();
      useLoadingStore.getState().stopGeneration();

      expect(useLoadingStore.getState().isGenerating).toBe(false);
    });

    it('should set generationStartTime to null', () => {
      useLoadingStore.getState().startGeneration();
      useLoadingStore.getState().stopGeneration();

      expect(useLoadingStore.getState().generationStartTime).toBeNull();
    });
  });

  describe('getElapsedTime', () => {
    it('should return null when not generating', () => {
      expect(useLoadingStore.getState().getElapsedTime()).toBeNull();
    });

    it('should return null after stopGeneration', () => {
      useLoadingStore.getState().startGeneration();
      useLoadingStore.getState().stopGeneration();

      expect(useLoadingStore.getState().getElapsedTime()).toBeNull();
    });

    it('should return positive value when generating', () => {
      const startTime = 1700000000000;
      const currentTime = 1700000005000; // 5 seconds later

      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // for startGeneration
        .mockReturnValueOnce(currentTime); // for getElapsedTime

      useLoadingStore.getState().startGeneration();
      const elapsed = useLoadingStore.getState().getElapsedTime();

      expect(elapsed).toBe(5000);

      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should return increasing elapsed time', () => {
      const startTime = 1700000000000;

      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // for startGeneration
        .mockReturnValueOnce(startTime + 1000) // first getElapsedTime
        .mockReturnValueOnce(startTime + 3000); // second getElapsedTime

      useLoadingStore.getState().startGeneration();

      const elapsed1 = useLoadingStore.getState().getElapsedTime();
      const elapsed2 = useLoadingStore.getState().getElapsedTime();

      expect(elapsed1).toBe(1000);
      expect(elapsed2).toBe(3000);
      expect(elapsed2!).toBeGreaterThan(elapsed1!);

      vi.spyOn(Date, 'now').mockRestore();
    });
  });
});
