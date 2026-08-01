import PQueue from 'p-queue';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import * as queries from '../db/queries.js';
import { JobStatus, ProgressData, EmailResult } from '../types/index.js';
import * as socket from './socket.js';
// The pipeline will be provided by another agent
import { verifyEmail } from './verification/pipeline.js';

class JobProcessor {
  private queue: PQueue;
  private jobId: string;
  private isCancelled: boolean = false;
  private startTime: number = 0;
  private emailsProcessedSinceStart: number = 0;

  constructor(jobId: string) {
    this.jobId = jobId;
    this.queue = new PQueue({ concurrency: config.CONCURRENCY });
  }

  public async start() {
    this.isCancelled = false;
    this.startTime = Date.now();
    this.emailsProcessedSinceStart = 0;
    
    queries.updateJobStatus(this.jobId, JobStatus.RUNNING);
    socket.emitLog(this.jobId, 'Job started');
    
    const unverifiedEmails = queries.getUnverifiedEmails(this.jobId);
    if (unverifiedEmails.length === 0) {
      this.completeJob();
      return;
    }

    const job = queries.getJob(this.jobId);
    if (!job) return;
    
    let progressData: ProgressData = job.progressData;

    let counter = 0;
    
    for (const { id, email } of unverifiedEmails) {
      if (this.isCancelled || this.queue.isPaused) break;
      
      this.queue.add(async () => {
        if (this.isCancelled) return;
        
        try {
          // Process email using pipeline
          const result = await verifyEmail(email);
          
          // Update DB
          queries.updateEmail(id, result);
          
          // Update progress stats
          progressData.processed++;
          this.emailsProcessedSinceStart++;
          if (result.status === 'valid') progressData.valid++;
          else if (result.status === 'invalid') progressData.invalid++;
          else if (result.status === 'risky') progressData.risky++;
          else if (result.status === 'catch-all') progressData.catchAll++;
          else progressData.unknown++;
          
          // Calculate speed and ETA
          const elapsed = (Date.now() - this.startTime) / 1000;
          if (elapsed > 0) {
            progressData.speed = Math.round(this.emailsProcessedSinceStart / elapsed);
            const remaining = progressData.total - progressData.processed;
            progressData.eta = progressData.speed > 0 ? Math.round(remaining / progressData.speed) : 0;
          }
          
          counter++;
          if (counter % 10 === 0) {
            queries.updateJobProgress(this.jobId, progressData);
            socket.emitProgress(this.jobId, progressData);
            socket.emitStatsUpdate(this.jobId, queries.getJobStats(this.jobId));
          }
          
          socket.emitEmailVerified(this.jobId, result);
        } catch (error) {
          logger.error(`Error processing email ${email}:`, error);
        }
      });
    }

    await this.queue.onIdle();
    
    if (!this.isCancelled && !this.queue.isPaused) {
      queries.updateJobProgress(this.jobId, progressData);
      socket.emitProgress(this.jobId, progressData);
      socket.emitStatsUpdate(this.jobId, queries.getJobStats(this.jobId));
      this.completeJob();
    }
  }

  public pause() {
    this.queue.pause();
    queries.updateJobStatus(this.jobId, JobStatus.PAUSED);
    socket.emitLog(this.jobId, 'Job paused');
  }

  public resume() {
    this.queue.start();
    this.start();
  }

  public cancel() {
    this.isCancelled = true;
    this.queue.clear();
    queries.updateJobStatus(this.jobId, JobStatus.CANCELLED, new Date().toISOString());
    socket.emitLog(this.jobId, 'Job cancelled');
    socket.emitJobComplete(this.jobId);
  }

  private completeJob() {
    queries.updateJobStatus(this.jobId, JobStatus.COMPLETED, new Date().toISOString());
    socket.emitLog(this.jobId, 'Job completed successfully');
    socket.emitJobComplete(this.jobId);
  }
}

const processors = new Map<string, JobProcessor>();

export const processJob = (jobId: string) => {
  let processor = processors.get(jobId);
  if (!processor) {
    processor = new JobProcessor(jobId);
    processors.set(jobId, processor);
  }
  processor.start();
};

export const pauseJob = (jobId: string) => {
  const processor = processors.get(jobId);
  if (processor) processor.pause();
};

export const resumeJob = (jobId: string) => {
  const processor = processors.get(jobId);
  if (processor) processor.resume();
  else processJob(jobId);
};

export const cancelJob = (jobId: string) => {
  const processor = processors.get(jobId);
  if (processor) processor.cancel();
  else {
    queries.updateJobStatus(jobId, JobStatus.CANCELLED, new Date().toISOString());
    socket.emitJobComplete(jobId);
  }
};
