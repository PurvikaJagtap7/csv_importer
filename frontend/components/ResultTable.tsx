'use client';

import { useState, useMemo } from 'react';
import { CrmRecord, ExtractResponse } from '@/types/crm.types';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Inbox, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as reactWindow from 'react-window';
const List = (reactWindow as any).FixedSizeList || reactWindow.FixedSizeList;
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const IMPORTED_COLUMNS: (keyof CrmRecord)[] = [
  'name',
  'email',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'crm_status',
  'data_source',
  'crm_note',
];

interface ResultTableProps {
  result: ExtractResponse;
}

function getStatusBadge(status: string | undefined) {
  if (!status) return <span className="text-muted-foreground/30">—</span>;

  switch (status) {
    case 'SALE_DONE':
      return <Badge variant="success">Sale Done</Badge>;
    case 'GOOD_LEAD_FOLLOW_UP':
      return (
        <Badge className="bg-amber-600/10 text-amber-600 hover:bg-amber-600/15 dark:bg-amber-500/20 dark:text-amber-400 border-transparent">
          Good Lead Follow Up
        </Badge>
      );
    case 'DID_NOT_CONNECT':
      return <Badge variant="secondary">Did Not Connect</Badge>;
    case 'BAD_LEAD':
      return <Badge variant="destructive">Bad Lead</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ResultTable({ result }: ResultTableProps) {
  const [skippedOpen, setSkippedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { imported, skipped, totalImported, totalSkipped } = result;

  const filteredImported = useMemo(() => {
    if (!searchQuery.trim()) return imported;
    const query = searchQuery.toLowerCase().trim();
    return imported.filter((rec) => {
      const nameMatch = rec.name?.toLowerCase().includes(query) ?? false;
      const emailMatch = rec.email?.toLowerCase().includes(query) ?? false;
      const phoneMatch = rec.mobile_without_country_code?.toLowerCase().includes(query) ?? false;
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [imported, searchQuery]);

  const importedColumns = useMemo(() => {
    return IMPORTED_COLUMNS.map((col) => ({
      accessorKey: col,
      header: col === 'mobile_without_country_code' ? 'Mobile' : col.replace(/_/g, ' '),
      cell: (info: any) => {
        const val = info.getValue();
        if (col === 'crm_status') {
          return getStatusBadge(val);
        }
        if (col === 'crm_note' && val) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={
                  <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 truncate block">
                    {val}
                  </span>
                } />
                <TooltipContent className="max-w-xs break-words">
                  {val}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return val ?? '';
      },
    }));
  }, []);

  const importedTable = useReactTable({
    data: filteredImported,
    columns: importedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const skippedColumns = useMemo(() => [
    {
      accessorKey: 'row',
      header: 'Row Data',
      cell: (info: any) => {
        const row = info.getValue();
        return typeof row === 'object' && row !== null
          ? Object.values(row).filter(Boolean).join(', ')
          : String(row ?? '');
      }
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: (info: any) => (
        <Badge variant="destructive" className="font-medium">
          {info.getValue() ?? ''}
        </Badge>
      )
    }
  ], []);

  const skippedTable = useReactTable({
    data: skipped,
    columns: skippedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isImportedLarge = filteredImported.length >= 100;
  const isSkippedLarge = skipped.length >= 100;

  const shouldScrollImported = filteredImported.length > 12;
  const shouldScrollSkipped = skipped.length > 12;

  // Render Virtualized Imported Table (100+ rows)
  const renderVirtualizedImported = () => {
    const colWidth = 150;
    const totalWidth = importedColumns.length * colWidth;
    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${importedColumns.length}, minmax(${colWidth}px, 1fr))`,
    };

    const VirtualRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = importedTable.getRowModel().rows[index];
      return (
        <div
          style={{ ...style, ...gridStyle, width: `${totalWidth}px` }}
          className="hover:bg-muted/50 transition-colors border-b border-border/50 bg-card flex items-center"
        >
          {row.getVisibleCells().map((cell) => {
            const isCustom = cell.column.id === 'crm_status' || cell.column.id === 'crm_note';
            return (
              <div
                key={cell.id}
                className="px-4 py-3 text-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ width: `${colWidth}px`, flex: '1 0 auto' }}
              >
                {isCustom ? (
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                ) : (
                  (cell.getValue() as string) || <span className="text-muted-foreground/30">—</span>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto w-full">
          <div className="flex flex-col" style={{ width: `${totalWidth}px` }}>
            <div
              style={gridStyle}
              className="bg-muted/95 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide flex"
            >
              {importedTable.getHeaderGroups().map((headerGroup) => (
                headerGroup.headers.map((header) => (
                  <div key={header.id} className="px-4 py-3 text-left" style={{ width: `${colWidth}px`, flex: '1 0 auto' }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                ))
              ))}
            </div>
            <List
              height={400}
              itemCount={filteredImported.length}
              itemSize={44}
              width={totalWidth}
            >
              {VirtualRow}
            </List>
          </div>
        </div>
      </Card>
    );
  };

  // Render Virtualized Skipped Table (100+ rows)
  const renderVirtualizedSkipped = () => {
    const colWidths = [500, 250];
    const totalWidth = colWidths[0] + colWidths[1];
    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `${colWidths[0]}px ${colWidths[1]}px`,
    };

    const VirtualRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = skippedTable.getRowModel().rows[index];
      return (
        <div
          style={{ ...style, ...gridStyle, width: `${totalWidth}px` }}
          className="hover:bg-muted/50 transition-colors border-b border-border/50 bg-card flex items-center"
        >
          {row.getVisibleCells().map((cell, cellIdx) => (
            <div
              key={cell.id}
              className="px-4 py-3 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ width: `${colWidths[cellIdx]}px`, flex: '1 0 auto' }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="overflow-x-auto w-full">
        <div className="flex flex-col" style={{ width: `${totalWidth}px` }}>
          <div
            style={gridStyle}
            className="bg-muted/95 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide flex"
          >
            {skippedTable.getHeaderGroups().map((headerGroup) => (
              headerGroup.headers.map((header, headerIdx) => (
                <div key={header.id} className="px-4 py-3 text-left" style={{ width: `${colWidths[headerIdx]}px`, flex: '1 0 auto' }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              ))
            ))}
          </div>
          <List
            height={300}
            itemCount={skipped.length}
            itemSize={44}
            width={totalWidth}
          >
            {VirtualRow}
          </List>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Total Imported
            </CardTitle>
            <Badge variant="success" className="font-semibold">Success</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-4xl font-bold text-foreground tracking-tight">{totalImported}</p>
            <p className="text-xs text-muted-foreground mt-1">Successfully parsed & validated</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Total Skipped
            </CardTitle>
            {totalSkipped > 0 ? (
              <Badge variant="destructive" className="font-semibold">Skipped</Badge>
            ) : (
              <Badge variant="outline" className="font-semibold text-muted-foreground">None</Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-4xl font-bold text-foreground tracking-tight">{totalSkipped}</p>
            <p className="text-xs text-muted-foreground mt-1">Failed validation or missing keys</p>
          </CardContent>
        </Card>
      </div>

      {/* Imported Records Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Imported Records</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              {filteredImported.length} records
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full bg-card"
            />
          </div>
        </div>

        {imported.length === 0 ? (
          <Card className="border border-dashed border-border py-8 flex flex-col items-center justify-center text-center">
            <Inbox className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No records were imported.</p>
          </Card>
        ) : filteredImported.length === 0 ? (
          <Card className="border border-dashed border-border py-8 flex flex-col items-center justify-center text-center">
            <Inbox className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No matching records found.</p>
          </Card>
        ) : isImportedLarge ? (
          renderVirtualizedImported()
        ) : (
          <Card className="overflow-hidden border border-border">
            <div className={shouldScrollImported ? 'max-h-[480px] overflow-y-auto w-full' : 'w-full'}>
              <Table className="relative w-full text-sm border-collapse">
                <TableHeader className={shouldScrollImported ? "sticky top-0 bg-background/95 backdrop-blur-xs z-10 border-b border-border shadow-xs" : ""}>
                  {importedTable.getHeaderGroups().map((headerGroup) => (
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
                  {importedTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-4 py-3 text-foreground whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis h-auto"
                          title={String(cell.getValue() ?? '')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext()) || (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Skipped Records Collapsible */}
      {skipped.length > 0 && (
        <Card className="border border-border overflow-hidden bg-card">
          <button
            onClick={() => setSkippedOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
          >
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              Skipped Records Details
              <Badge variant="secondary" className="font-semibold text-xs">
                {totalSkipped}
              </Badge>
            </span>
            {skippedOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {skippedOpen && (
            <div className="border-t border-border">
              {isSkippedLarge ? (
                renderVirtualizedSkipped()
              ) : (
                <div className={shouldScrollSkipped ? 'max-h-[360px] overflow-y-auto w-full' : 'w-full'}>
                  <Table className="w-full text-sm border-collapse">
                    <TableHeader className={shouldScrollSkipped ? "sticky top-0 bg-background/95 backdrop-blur-xs z-10 border-b border-border shadow-xs" : ""}>
                      {skippedTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-b-0">
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide h-auto">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="bg-card">
                      {skippedTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-4 py-3 h-auto max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
