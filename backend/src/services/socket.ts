import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ProgressData, EmailResult } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
    
    socket.on('subscribe', (jobId: string) => {
      socket.join(`job:${jobId}`);
      logger.info(`Socket ${socket.id} subscribed to job:${jobId}`);
    });
    
    socket.on('unsubscribe', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      logger.info(`Socket ${socket.id} unsubscribed from job:${jobId}`);
    });
  });

  return io;
};

export const emitProgress = (jobId: string, data: ProgressData) => {
  if (io) io.to(`job:${jobId}`).emit('progress', data);
};

export const emitEmailVerified = (jobId: string, result: EmailResult) => {
  if (io) io.to(`job:${jobId}`).emit('email_verified', result);
};

export const emitLog = (jobId: string, message: string, level: string = 'info') => {
  if (io) io.to(`job:${jobId}`).emit('log', { message, level, timestamp: new Date().toISOString() });
};

export const emitJobComplete = (jobId: string) => {
  if (io) io.to(`job:${jobId}`).emit('job_complete', { jobId });
};

export const emitJobError = (jobId: string, error: any) => {
  if (io) io.to(`job:${jobId}`).emit('job_error', { jobId, error: error.message || 'Unknown error' });
};

export const emitStatsUpdate = (jobId: string, stats: Record<string, number>) => {
  if (io) io.to(`job:${jobId}`).emit('stats_update', stats);
};
