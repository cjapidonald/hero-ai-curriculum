import { ReactNode } from 'react';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';

interface VirtualListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  emptyMessage?: string;
  className?: string;
}

/**
 * VirtualList Component
 * Efficiently renders large lists using virtual scrolling
 * General purpose list that can render any content
 */
export function VirtualList<T>({
  data,
  renderItem,
  itemHeight,
  containerHeight,
  emptyMessage = 'No items to display',
  className = '',
}: VirtualListProps<T>) {
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(data.length, {
    itemHeight,
    containerHeight,
    overscan: 5,
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: `${containerHeight}px` }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {virtualItems.map(({ index, offsetTop }) => {
          const item = data[index];
          return (
            <div
              key={index}
              className="absolute w-full"
              style={{
                height: `${itemHeight}px`,
                transform: `translateY(${offsetTop}px)`,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Example usage:
 *
 * <VirtualList
 *   data={largeArray}
 *   itemHeight={80}
 *   containerHeight={400}
 *   renderItem={(item, index) => (
 *     <Card className="m-2 p-4">
 *       <h3>{item.title}</h3>
 *       <p>{item.description}</p>
 *     </Card>
 *   )}
 * />
 */
