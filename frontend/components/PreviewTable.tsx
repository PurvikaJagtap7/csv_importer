'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{rows.length}</span> rows
      </p>
      <Card className="overflow-hidden border border-border">
        <div className="max-h-[500px] overflow-auto">
          <Table className="relative w-full text-sm border-collapse">
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-xs z-10 border-b border-border">
              <TableRow className="border-b-0">
                {headers.map((header) => (
                  <TableHead
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap h-auto"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {rows.map((row, rowIdx) => (
                <TableRow
                  key={rowIdx}
                  className="hover:bg-muted/50 transition-colors border-b border-border/50"
                >
                  {headers.map((header) => (
                    <TableCell
                      key={header}
                      className="px-4 py-3 text-foreground whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis h-auto"
                      title={row[header] ?? ''}
                    >
                      {row[header] ?? (
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
    </div>
  );
}
