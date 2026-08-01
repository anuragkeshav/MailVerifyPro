export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';
export const JobStatus = {
  PENDING: 'pending' as const,
  RUNNING: 'running' as const,
  PAUSED: 'paused' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const
};

export type EmailStatus = 'valid' | 'invalid' | 'risky' | 'catch-all' | 'unknown';
export const EmailStatus = {
  VALID: 'valid' as const,
  INVALID: 'invalid' as const,
  RISKY: 'risky' as const,
  CATCH_ALL: 'catch-all' as const,
  UNKNOWN: 'unknown' as const
};

export interface EmailResult {
  email: string;
  status: EmailStatus;
  confidence: number;
  mxHost?: string;
  smtpCode?: number;
  smtpMessage?: string;
  isDisposable: boolean;
  isRole: boolean;
  isCatchAll: boolean;
  reason?: string;
  verificationTimeMs?: number;
  retryCount: number;
}

export interface ProgressData {
  processed: number;
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  catchAll: number;
  unknown: number;
  speed: number;
  eta: number;
}

export interface Job {
  id: string;
  filename: string;
  totalEmails: number;
  duplicatesRemoved: number;
  emptyRows: number;
  status: JobStatus;
  createdAt: string;
  completedAt?: string;
  progressData: ProgressData;
}

export interface VerificationStep {
  name: string;
  result: boolean;
  details?: string;
}

export interface SmtpResponse {
  code: number;
  message: string;
  accepted: boolean;
}

export interface DomainInfo {
  domain: string;
  hasMx: boolean;
  mxRecords: { exchange: string; priority: number }[];
  cached: boolean;
}
