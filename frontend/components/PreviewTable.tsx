'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import * as reactWindow from 'react-window';
const List = (reactWindow as any).FixedSizeList || reactWindow.FixedSizeList;

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  const columns = useMemo(() => {
    return headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info: any) => info.getValue() ?? '',
    }));
  }, [headers]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const shouldScrollVertically = rows.length > 12;
  const isLargeFile = rows.length >= 100;

  if (isLargeFile) {
    const colWidth = 160;
    const totalWidth = columns.length * colWidth;
    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns.length}, minmax(${colWidth}px, 1fr))`,
    };

    const VirtualRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = table.getRowModel().rows[index];
      return (
        <div
          style={{ ...style, ...gridStyle, width: `${totalWidth}px` }}
          className="hover:bg-muted/50 transition-colors border-b border-border/50 bg-card flex items-center"
        >
          {row.getVisibleCells().map((cell) => {
            const val = cell.getValue() as string;
            return (
              <div
                key={cell.id}
                className="px-4 py-3 text-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ width: `${colWidth}px`, flex: '1 0 auto' }}
                title={val}
              >
                {val || <span className="text-muted-foreground/30">—</span>}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rows.length}</span> rows (Virtualized)
        </p>
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto w-full">
            <div className="flex flex-col" style={{ width: `${totalWidth}px` }}>
              <div
                style={gridStyle}
                className="bg-muted/95 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide flex"
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  headerGroup.headers.map((header) => (
                    <div key={header.id} className="px-4 py-3 text-left" style={{ width: `${colWidth}px`, flex: '1 0 auto' }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  ))
                ))}
              </div>
              <List
                height={400}
                itemCount={rows.length}
                itemSize={44}
                width={totalWidth}
              >
                {VirtualRow}
              </List>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{rows.length}</span> rows
      </p>
      <Card className="overflow-hidden border border-border">
        <div className={shouldScrollVertically ? 'max-h-[480px] overflow-y-auto w-full' : 'w-full'}>
          <Table className="relative w-full text-sm border-collapse">
            <TableHeader className={shouldScrollVertically ? "sticky top-0 bg-background/95 backdrop-blur-xs z-10 border-b border-border shadow-xs" : ""}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b-0">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap h-auto"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-card">
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors border-b border-border/50"
                >
                  {row.getVisibleCells().map((cell) => {
                    const val = cell.getValue() as string;
                    return (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 text-foreground whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis h-auto"
                        title={val}
                      >
                        {val || <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
