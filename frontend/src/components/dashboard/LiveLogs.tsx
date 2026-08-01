import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface LiveLogsProps {
  logs: LogEntry[];
}

export function LiveLogs({ logs }: LiveLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const displayLogs = logs.slice(-200);

  const getLogColor = (level: string, status?: string) => {
    if (status === 'valid' || level === 'success') return 'text-emerald-400';
    if (status === 'invalid' || level === 'error') return 'text-red-400';
    if (status === 'risky' || level === 'warn') return 'text-amber-400';
    if (status === 'catch-all' || level === 'info') return 'text-sky-400';
    return 'text-zinc-400';
  };

  return (
    <Card className="h-full flex flex-col bg-slate-950 dark:bg-slate-950 overflow-hidden border-slate-800">
      <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-900/50">
        <Terminal className="h-4 w-4 text-slate-400" />
        <h3 className="font-mono text-sm font-semibold text-slate-200">Live Verification Log</h3>
      </div>
      <ScrollArea className="flex-1 p-4 h-full">
        <div className="font-mono text-xs space-y-1">
          <AnimatePresence initial={false}>
            {displayLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3"
              >
                <span className="text-slate-600 shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={cn("break-all", getLogColor(log.level, log.status))}>
                  {log.email ? <span className="font-semibold">{log.email}</span> : null}
                  {log.email && ' - '}
                  {log.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </Card>
  );
}
