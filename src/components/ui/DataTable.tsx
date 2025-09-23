import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DataTableColumn {
  key: string;
  header: string;
  className?: string;
}

interface DataTableProps {
  columns: DataTableColumn[];
  rows: Record<string, React.ReactNode>[];
  emptyText?: string;
  className?: string;
  onRowClick?: (row: Record<string, React.ReactNode>, index: number) => void;
  selectedRowIndex?: number;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  emptyText = "No data available",
  className,
  onRowClick,
  selectedRowIndex: externalSelectedRowIndex
}) => {
  const [internalSelectedRowIndex, setInternalSelectedRowIndex] = useState<number | null>(null);
  
  // Use external selectedRowIndex if provided, otherwise use internal state
  const selectedRowIndex = externalSelectedRowIndex !== undefined ? externalSelectedRowIndex : internalSelectedRowIndex;

  const handleRowClick = (row: Record<string, React.ReactNode>, index: number) => {
    if (externalSelectedRowIndex === undefined) {
      setInternalSelectedRowIndex(index);
    }
    onRowClick?.(row, index);
  };

  const handleKeyDown = (event: React.KeyboardEvent, row: Record<string, React.ReactNode>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(row, index);
    }
  };

  if (rows.length === 0) {
    return (
      <div className={cn("glass rounded-2xl p-8 text-center", className)}>
        <p className="text-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl overflow-hidden", className)}>
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-vizla-elev1/60 border-b border-vizla-borderSubtle">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-vizla-text-muted uppercase tracking-wider",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vizla-borderSubtle">
            {rows.map((row, index) => (
              <tr
                key={index}
                tabIndex={0}
                onClick={() => handleRowClick(row, index)}
                onKeyDown={(e) => handleKeyDown(e, row, index)}
                className={cn(
                  "h-11 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
                  selectedRowIndex === index
                    ? "bg-vizla-elev2"
                    : "hover:bg-vizla-glassElev"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-sm text-vizla-text-primary",
                      column.className
                    )}
                  >
                    {row[column.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { DataTable };
