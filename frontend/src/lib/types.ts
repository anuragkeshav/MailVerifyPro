export type EmailStatus = 'valid' | 'invalid' | 'risky' | 'catch-all' | 'unknown';

export interface EmailResult {
  email: string;
  status: EmailStatus;
  confidence: number;
  reason?: string;
  mx_host?: string;
}

export interface JobStats {
  total: number;
  processed: number;
  valid: number;
  invalid: number;
  risky: number;
  catch_all: number;
  unknown: number;
  duplicates: number;
}

export interface Job {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  stats: JobStats;
}

export interface ProgressData {
  jobId: string;
  processed: number;
  total: number;
  percent: number;
  status: Job['status'];
  speed?: number;
  etaSeconds?: number;
}

export interface UploadResponse {
  jobId: string;
  filename: string;
  totalRows: number;
  emailColumn: string;
  preview: string[][];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
  email?: string;
  status?: EmailStatus;
}
