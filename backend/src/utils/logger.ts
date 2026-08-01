import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

if (!fs.existsSync(config.LOGS_DIR)) {
  fs.mkdirSync(config.LOGS_DIR, { recursive: true });
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(config.LOGS_DIR, 'errors.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(config.LOGS_DIR, 'verification.log'),
      level: 'info',
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    })
  ]
});
