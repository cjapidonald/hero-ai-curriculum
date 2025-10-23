import { ReactNode } from 'react';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (item: T) => ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  containerHeight?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

/**
 * VirtualTable Component
 * Efficiently renders large datasets using virtual scrolling
 * Only renders visible rows for better performance
 */
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 60,
  containerHeight = 600,
  emptyMessage = 'No data available',
  onRowClick,
}: VirtualTableProps<T>) {
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(data.length, {
    itemHeight: rowHeight,
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
      className="border rounded-lg overflow-auto"
      style={{ height: `${containerHeight}px` }}
    >
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                style={{ width: column.width }}
                className="border-b"
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Spacer for virtual scroll positioning */}
          <tr style={{ height: `${totalHeight}px` }} />

          {virtualItems.map(({ index, offsetTop }) => {
            const item = data[index];
            return (
              <TableRow
                key={index}
                className={`absolute w-full ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                style={{
                  height: `${rowHeight}px`,
                  transform: `translateY(${offsetTop}px)`,
                }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    style={{ width: column.width }}
                    className="border-b"
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key]?.toString() || '-'}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Example usage:
 *
 * const columns = [
 *   { key: 'name', label: 'Name', width: '200px' },
 *   { key: 'email', label: 'Email', width: '250px' },
 *   {
 *     key: 'status',
 *     label: 'Status',
 *     render: (item) => (
 *       <Badge variant={item.is_active ? 'default' : 'secondary'}>
 *         {item.is_active ? 'Active' : 'Inactive'}
 *       </Badge>
 *     )
 *   },
 * ];
 *
 * <VirtualTable
 *   data={largeDataset}
 *   columns={columns}
 *   rowHeight={60}
 *   containerHeight={500}
 *   onRowClick={(item) => console.log('Clicked:', item)}
 * />
 */
