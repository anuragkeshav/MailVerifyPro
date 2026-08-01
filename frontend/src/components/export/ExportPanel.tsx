import { JobStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExportPanelProps {
  jobId: string;
  stats: JobStats | null;
}

export function ExportPanel({ jobId, stats }: ExportPanelProps) {
  if (!stats) return null;

  const handleDownload = (type: string) => {
    window.open(`/api/jobs/${jobId}/export?status=${type}`, '_blank');
  };

  const buttons = [
    { label: 'All Results', type: 'all', count: stats.total, colorClass: 'bg-primary/10 text-primary hover:bg-primary/20' },
    { label: 'Valid', type: 'valid', count: stats.valid, colorClass: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
    { label: 'Invalid', type: 'invalid', count: stats.invalid, colorClass: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
    { label: 'Risky', type: 'risky', count: stats.risky, colorClass: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' },
    { label: 'Catch-All', type: 'catch-all', count: stats.catch_all, colorClass: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
    { label: 'Unknown', type: 'unknown', count: stats.unknown, colorClass: 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export Results</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {buttons.map((btn) => (
            <motion.div key={btn.type} variants={itemVariants}>
              <Button
                variant="outline"
                className={`w-full justify-between h-auto py-3 px-4 border-transparent ${btn.colorClass}`}
                onClick={() => handleDownload(btn.type)}
                disabled={btn.count === 0}
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {btn.label}
                </span>
                <span className="text-xs font-bold bg-background/50 px-2 py-1 rounded-full">
                  {btn.count.toLocaleString()}
                </span>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}
