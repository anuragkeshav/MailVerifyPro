import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    filename TEXT,
    total_emails INTEGER,
    duplicates_removed INTEGER DEFAULT 0,
    empty_rows INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    completed_at TEXT,
    progress_data TEXT
  );

  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    email TEXT,
    status TEXT,
    confidence INTEGER,
    mx_host TEXT,
    smtp_code INTEGER,
    smtp_message TEXT,
    is_disposable INTEGER DEFAULT 0,
    is_role INTEGER DEFAULT 0,
    is_catch_all INTEGER DEFAULT 0,
    reason TEXT,
    verification_time_ms INTEGER,
    verified_at TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_emails_job_id ON emails(job_id);
  CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
  CREATE INDEX IF NOT EXISTS idx_emails_email ON emails(email);
`);

export { db };
