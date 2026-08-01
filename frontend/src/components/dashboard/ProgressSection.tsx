import { ProgressData } from '@/lib/types';
import { Progress } from '../ui/progress';
import { Zap, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressSectionProps {
  progress: ProgressData | null;
}

export function ProgressSection({ progress }: ProgressSectionProps) {
  if (!progress) return null;

  const isRunning = progress.status === 'processing';
  
  // Format ETA
  const formatETA = (seconds?: number) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s remaining`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s remaining`;
  };

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="relative z-10 space-y-5">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className={cn("h-5 w-5", isRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
              Verification Progress
            </h3>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              Status: <span className={cn(
                "font-medium",
                progress.status === 'processing' && "text-primary",
                progress.status === 'paused' && "text-amber-500",
                progress.status === 'completed' && "text-emerald-500",
                progress.status === 'failed' && "text-destructive"
              )}>{progress.status}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight">
              {progress.percent.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {progress.processed.toLocaleString()} / {progress.total.toLocaleString()} emails
            </div>
          </div>
        </div>

        <Progress value={progress.percent} className="h-3" />

        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-foreground">{progress.speed?.toFixed(1) || 0}</span> emails/sec
          </div>
          <div className="flex items-center gap-2 text-muted-foreground justify-end">
            <Clock className="h-4 w-4 text-blue-500" />
            {formatETA(progress.etaSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
}
