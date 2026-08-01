import { db } from './database.js';
import { Job, JobStatus, ProgressData, EmailResult } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export const createJob = (job: Omit<Job, 'progressData'> & { progressData: ProgressData }) => {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, filename, total_emails, duplicates_removed, empty_rows, status, created_at, progress_data)
    VALUES (@id, @filename, @totalEmails, @duplicatesRemoved, @emptyRows, @status, @createdAt, @progressData)
  `);
  
  stmt.run({
    id: job.id,
    filename: job.filename,
    totalEmails: job.totalEmails,
    duplicatesRemoved: job.duplicatesRemoved,
    emptyRows: job.emptyRows,
    status: job.status,
    createdAt: job.createdAt,
    progressData: JSON.stringify(job.progressData)
  });
};

export const getJob = (id: string): Job | undefined => {
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  
  return {
    id: row.id,
    filename: row.filename,
    totalEmails: row.total_emails,
    duplicatesRemoved: row.duplicates_removed,
    emptyRows: row.empty_rows,
    status: row.status as JobStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    progressData: JSON.parse(row.progress_data)
  };
};

export const updateJobStatus = (id: string, status: JobStatus, completedAt?: string) => {
  if (completedAt) {
    db.prepare('UPDATE jobs SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, id);
  } else {
    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, id);
  }
};

export const updateJobProgress = (id: string, progressData: ProgressData) => {
  db.prepare('UPDATE jobs SET progress_data = ? WHERE id = ?').run(JSON.stringify(progressData), id);
};

export const getAllJobs = (): Job[] => {
  const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as any[];
  return rows.map(row => ({
    id: row.id,
    filename: row.filename,
    totalEmails: row.total_emails,
    duplicatesRemoved: row.duplicates_removed,
    emptyRows: row.empty_rows,
    status: row.status as JobStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    progressData: JSON.parse(row.progress_data)
  }));
};

export const deleteJob = (id: string) => {
  const deleteEmails = db.prepare('DELETE FROM emails WHERE job_id = ?');
  const deleteJobRow = db.prepare('DELETE FROM jobs WHERE id = ?');
  
  const transaction = db.transaction(() => {
    deleteEmails.run(id);
    deleteJobRow.run(id);
  });
  
  transaction();
};

export const insertEmail = (jobId: string, email: string) => {
  const stmt = db.prepare(`
    INSERT INTO emails (id, job_id, email, status)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(uuidv4(), jobId, email, 'pending');
};

export const insertEmails = (jobId: string, emails: string[]) => {
  const insert = db.prepare(`
    INSERT INTO emails (id, job_id, email, status)
    VALUES (@id, @jobId, @email, 'pending')
  `);
  
  const transaction = db.transaction((emailsList: string[]) => {
    for (const email of emailsList) {
      insert.run({ id: uuidv4(), jobId, email });
    }
  });
  
  transaction(emails);
};

export const updateEmail = (id: string, result: EmailResult) => {
  const stmt = db.prepare(`
    UPDATE emails SET
      status = @status,
      confidence = @confidence,
      mx_host = @mxHost,
      smtp_code = @smtpCode,
      smtp_message = @smtpMessage,
      is_disposable = @isDisposable,
      is_role = @isRole,
      is_catch_all = @isCatchAll,
      reason = @reason,
      verification_time_ms = @verificationTimeMs,
      verified_at = @verifiedAt,
      retry_count = @retryCount
    WHERE id = @id
  `);
  
  stmt.run({
    id,
    status: result.status,
    confidence: result.confidence,
    mxHost: result.mxHost || null,
    smtpCode: result.smtpCode || null,
    smtpMessage: result.smtpMessage || null,
    isDisposable: result.isDisposable ? 1 : 0,
    isRole: result.isRole ? 1 : 0,
    isCatchAll: result.isCatchAll ? 1 : 0,
    reason: result.reason || null,
    verificationTimeMs: result.verificationTimeMs || null,
    verifiedAt: new Date().toISOString(),
    retryCount: result.retryCount
  });
};

export const getEmailsByJob = (jobId: string, opts?: { status?: string, search?: string, page?: number, limit?: number }) => {
  let query = 'SELECT * FROM emails WHERE job_id = ?';
  const params: any[] = [jobId];
  
  if (opts?.status) {
    query += ' AND status = ?';
    params.push(opts.status);
  }
  
  if (opts?.search) {
    query += ' AND email LIKE ?';
    params.push(`%${opts.search}%`);
  }
  
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countQuery).get(...params) as any).count;
  
  if (opts?.limit && opts?.page) {
    query += ' LIMIT ? OFFSET ?';
    params.push(opts.limit, (opts.page - 1) * opts.limit);
  }
  
  const emails = db.prepare(query).all(...params);
  
  return { emails, total };
};

export const getJobStats = (jobId: string) => {
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM emails WHERE job_id = ? GROUP BY status').all(jobId) as any[];
  const stats: Record<string, number> = {};
  for (const row of rows) {
    stats[row.status] = row.count;
  }
  return stats;
};

export const getUnverifiedEmails = (jobId: string) => {
  return db.prepare('SELECT id, email FROM emails WHERE job_id = ? AND status = ?').all(jobId, 'pending') as {id: string, email: string}[];
};

export const getEmailCountByStatus = (jobId: string, status: string): number => {
  const row = db.prepare('SELECT COUNT(*) as count FROM emails WHERE job_id = ? AND status = ?').get(jobId, status) as any;
  return row ? row.count : 0;
};
