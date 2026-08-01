import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useSocket } from './useSocket';
import { Job, JobStats, EmailResult, UploadResponse } from '@/lib/types';
import { toast } from 'sonner';

export function useVerification() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  
  const { isConnected, progress, logs, stats: socketStats, clearLogs } = useSocket(activeJobId);

  const [stats, setStats] = useState<JobStats | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);

  // Sync socket stats to local stats
  useEffect(() => {
    if (socketStats) {
      setStats(socketStats);
    }
  }, [socketStats]);

  const loadJob = useCallback(async (jobId: string) => {
    try {
      const data = await api.getJobDetails(jobId);
      setJob(data);
      setStats(data.stats);
      setActiveJobId(jobId);
    } catch (error) {
      toast.error('Failed to load job details');
      console.error(error);
    }
  }, []);

  const loadResults = useCallback(async (page: number = 1, status: string = 'all', search: string = '') => {
    if (!activeJobId) return;
    try {
      const data = await api.getResults(activeJobId, { page, limit: 10, status, search });
      setResults(data.results);
      setTotalResults(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
    }
  }, [activeJobId]);

  // Handle uploading a new file
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await api.uploadFile(file);
      setUploadData(data);
      setActiveJobId(data.jobId);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const startVerification = async () => {
    if (!activeJobId) return;
    try {
      await api.startVerification(activeJobId);
      setJob(prev => prev ? { ...prev, status: 'processing' } : null);
      toast.success('Verification started');
    } catch (error) {
      toast.error('Failed to start verification');
    }
  };

  const pauseVerification = async () => {
    if (!activeJobId) return;
    try {
      await api.pauseVerification(activeJobId);
      setJob(prev => prev ? { ...prev, status: 'paused' } : null);
      toast.info('Verification paused');
    } catch (error) {
      toast.error('Failed to pause verification');
    }
  };

  const resumeVerification = async () => {
    if (!activeJobId) return;
    try {
      await api.resumeVerification(activeJobId);
      setJob(prev => prev ? { ...prev, status: 'processing' } : null);
      toast.success('Verification resumed');
    } catch (error) {
      toast.error('Failed to resume verification');
    }
  };

  const cancelVerification = async () => {
    if (!activeJobId) return;
    try {
      await api.cancelVerification(activeJobId);
      setJob(prev => prev ? { ...prev, status: 'failed' } : null);
      toast.warning('Verification cancelled');
    } catch (error) {
      toast.error('Failed to cancel verification');
    }
  };

  const reset = () => {
    setActiveJobId(null);
    setJob(null);
    setStats(null);
    setResults([]);
    setUploadData(null);
    clearLogs();
  };

  // Derive status from either job object or progress events
  const currentStatus = progress?.status || job?.status;

  return {
    activeJobId,
    job: job ? { ...job, status: currentStatus as any } : null,
    stats,
    progress,
    logs,
    results,
    totalResults,
    currentPage,
    statusFilter,
    searchQuery,
    uploadData,
    isUploading,
    isConnected,
    setStatusFilter,
    setSearchQuery,
    loadJob,
    loadResults,
    handleUpload,
    startVerification,
    pauseVerification,
    resumeVerification,
    cancelVerification,
    reset,
  };
}
