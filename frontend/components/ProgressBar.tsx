'use client';

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground font-medium">
        {total === 0
          ? 'Starting…'
          : current >= total
          ? 'Finalizing results…'
          : `Processing batch ${current} of ${total}`}
      </p>
      <Progress value={pct} className="h-2 w-full bg-muted" />
      <p className="text-xs text-muted-foreground text-right">{pct}%</p>
    </div>
  );
}
