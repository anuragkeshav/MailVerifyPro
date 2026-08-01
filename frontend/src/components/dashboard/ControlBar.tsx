import { Play, Pause, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Job } from '@/lib/types';
import { motion } from 'framer-motion';

interface ControlBarProps {
  job: Job | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function ControlBar({ job, onPause, onResume, onCancel }: ControlBarProps) {
  if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'pending') {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-card border rounded-lg p-2 px-4 shadow-sm"
    >
      <span className="text-sm font-medium mr-auto">Controls</span>
      
      {job.status === 'processing' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPause}
          className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
        >
          <Pause className="h-4 w-4 mr-2" />
          Pause
        </Button>
      )}
      
      {job.status === 'paused' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onResume}
          className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
        >
          <Play className="h-4 w-4 mr-2" />
          Resume
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onCancel}
        className="border-destructive/50 text-destructive hover:bg-destructive/10"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </motion.div>
  );
}
