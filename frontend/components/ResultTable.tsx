'use client';

import { useState } from 'react';
import { CrmRecord, ExtractResponse } from '@/types/crm.types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function ResultTable({ result }: ResultTableProps) {
  const [skippedOpen, setSkippedOpen] = useState(false);
  const { imported, skipped, totalImported, totalSkipped } = result;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Imported
            </CardTitle>
            <Badge variant="success">Success</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-semibold text-foreground">{totalImported}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Skipped
            </CardTitle>
            {totalSkipped > 0 ? (
              <Badge variant="destructive">Skipped</Badge>
            ) : (
              <Badge variant="outline">None</Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-semibold text-foreground">{totalSkipped}</p>
          </CardContent>
        </Card>
      </div>

      {/* Imported records table */}
      {imported.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{imported.length}</span> imported records
          </p>
          <Card className="overflow-hidden border border-border">
            <div className="max-h-[500px] overflow-auto">
              <Table className="relative w-full text-sm border-collapse">
                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-xs z-10 border-b border-border">
                  <TableRow className="border-b-0">
                    {IMPORTED_COLUMNS.map((col) => (
                      <TableHead
                        key={col}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap h-auto"
                      >
                        {col.replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card">
                  {imported.map((record, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                      {IMPORTED_COLUMNS.map((col) => (
                        <TableCell
                          key={col}
                          className="px-4 py-3 text-foreground whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis h-auto"
                          title={record[col] ?? ''}
                        >
                          {record[col] ?? <span className="text-muted-foreground/30">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* Skipped records collapsible */}
      {skipped.length > 0 && (
        <Card className="border border-border overflow-hidden bg-card">
          <button
            onClick={() => setSkippedOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
          >
            <span className="text-sm font-medium text-foreground">
              Skipped records ({totalSkipped})
            </span>
            {skippedOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {skippedOpen && (
            <div className="max-h-[400px] overflow-auto">
              <Table className="w-full text-sm border-collapse">
                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-xs z-10 border-b border-border">
                  <TableRow className="border-b-0">
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide h-auto">
                      Row data
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide h-auto">
                      Reason
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card">
                  {skipped.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                      <TableCell
                        className="px-4 py-3 text-muted-foreground max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap h-auto"
                        title={JSON.stringify(item.row)}
                      >
                        {typeof item.row === 'object'
                          ? Object.values(item.row).filter(Boolean).join(', ')
                          : String(item.row)}
                      </TableCell>
                      <TableCell className="px-4 py-3 h-auto">
                        <Badge variant="destructive">
                          {item.reason}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
