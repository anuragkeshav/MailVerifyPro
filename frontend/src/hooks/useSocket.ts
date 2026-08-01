import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ProgressData, LogEntry, JobStats } from '@/lib/types';

export function useSocket(jobId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);

  useEffect(() => {
    if (!jobId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to the proxy
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:job', jobId);
      socket.emit('subscribe', jobId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('progress', (data: ProgressData) => {
      setProgress(data);
    });

    socket.on('log', (data: LogEntry) => {
      setLogs((prev) => {
        const newLogs = [...prev, data];
        // Keep max 200 logs
        if (newLogs.length > 200) {
          return newLogs.slice(newLogs.length - 200);
        }
        return newLogs;
      });
    });
    
    socket.on('email:verified', (_data: { email: string, status: string }) => {
        // We could store verified emails in a real-time list if needed,
        // but typically stats update is enough for the overview.
    });

    socket.on('stats:update', (data: JobStats) => {
      setStats(data);
    });
    socket.on('stats_update', (data: JobStats) => {
      setStats(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [jobId]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { isConnected, progress, logs, stats, clearLogs };
}
