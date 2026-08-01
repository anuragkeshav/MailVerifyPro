import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  PORT: number;
  SMTP_TIMEOUT: number;
  CONCURRENCY: number;
  PER_DOMAIN_CONCURRENCY: number;
  MAX_MX_HOSTS: number;
  MAX_RETRIES: number;
  EMAIL_VERIFICATION_PROVIDER: 'direct' | 'mailboxlayer';
  MAILBOXLAYER_API_KEY: string;
  VERIFICATION_API_TIMEOUT: number;
  MAILBOXLAYER_REQUEST_INTERVAL_MS: number;
  MAILBOXLAYER_MAX_RETRIES: number;
  LOG_LEVEL: string;
  HELO_DOMAIN: string;
  MAIL_FROM: string;
  FRONTEND_URL: string;
  DB_PATH: string;
  EXPORTS_DIR: string;
  LOGS_DIR: string;
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  SMTP_TIMEOUT: parseInt(process.env.SMTP_TIMEOUT || '10000', 10),
  CONCURRENCY: parseInt(process.env.CONCURRENCY || '5', 10),
  PER_DOMAIN_CONCURRENCY: parseInt(process.env.PER_DOMAIN_CONCURRENCY || '1', 10),
  MAX_MX_HOSTS: parseInt(process.env.MAX_MX_HOSTS || '3', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  EMAIL_VERIFICATION_PROVIDER: process.env.EMAIL_VERIFICATION_PROVIDER === 'mailboxlayer' ? 'mailboxlayer' : 'direct',
  MAILBOXLAYER_API_KEY: process.env.MAILBOXLAYER_API_KEY || '',
  VERIFICATION_API_TIMEOUT: parseInt(process.env.VERIFICATION_API_TIMEOUT || '15000', 10),
  MAILBOXLAYER_REQUEST_INTERVAL_MS: parseInt(process.env.MAILBOXLAYER_REQUEST_INTERVAL_MS || '1200', 10),
  MAILBOXLAYER_MAX_RETRIES: parseInt(process.env.MAILBOXLAYER_MAX_RETRIES || '2', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  HELO_DOMAIN: process.env.HELO_DOMAIN || 'localhost',
  MAIL_FROM: process.env.MAIL_FROM || 'verify@localhost',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DB_PATH: path.resolve(process.env.DB_PATH || '../data/verifier.db'),
  EXPORTS_DIR: path.resolve(process.env.EXPORTS_DIR || '../exports'),
  LOGS_DIR: path.resolve(process.env.LOGS_DIR || '../logs'),
};
