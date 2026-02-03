import { useRef, useCallback } from 'react';

export function useSyncScroll() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const syncScroll = useCallback(
    (source: HTMLDivElement, target: HTMLDivElement) => {
      if (isSyncing.current) return;
      isSyncing.current = true;

      const maxScroll = source.scrollHeight - source.clientHeight;
      const ratio = maxScroll > 0 ? source.scrollTop / maxScroll : 0;
      const targetMax = target.scrollHeight - target.clientHeight;
      target.scrollTop = ratio * targetMax;

      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    },
    [],
  );

  const handleLeftScroll = useCallback(() => {
    if (leftRef.current && rightRef.current) {
      syncScroll(leftRef.current, rightRef.current);
    }
  }, [syncScroll]);

  const handleRightScroll = useCallback(() => {
    if (rightRef.current && leftRef.current) {
      syncScroll(rightRef.current, leftRef.current);
    }
  }, [syncScroll]);

  return { leftRef, rightRef, handleLeftScroll, handleRightScroll };
}
