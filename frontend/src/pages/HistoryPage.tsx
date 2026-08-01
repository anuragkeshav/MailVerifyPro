import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Job } from '@/lib/types';
import { api } from '@/lib/api';
import { HistoryTable } from '@/components/history/HistoryTable';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await api.getHistory();
      setJobs(data);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await api.deleteJob(jobId);
      toast.success('Job deleted successfully');
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleView = (jobId: string) => {
    toast.info(`Viewing job ${jobId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verification History</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your past verification jobs.
        </p>
      </div>

      <HistoryTable 
        jobs={jobs} 
        onViewJob={handleView} 
        onDeleteJob={handleDelete} 
        isLoading={isLoading}
      />
    </motion.div>
  );
}
