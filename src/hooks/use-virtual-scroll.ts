import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    offsetTop: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook for virtual scrolling
 * Efficiently renders large lists by only showing visible items
 */
export function useVirtualScroll(
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Calculate which items should be visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Generate virtual items
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      offsetTop: i * itemHeight,
    });
  }

  const totalHeight = itemCount * itemHeight;

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerRef,
  };
}
