import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { initSocket } from './services/socket.js';
import { db } from './db/database.js';

// Import routes
import uploadRoutes from './routes/upload.js';
import verifyRoutes from './routes/verify.js';
import exportRoutes from './routes/export.js';
import historyRoutes from './routes/history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Create required directories
[config.EXPORTS_DIR, config.LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// API Routes — Unified under /api/jobs to match frontend
// Upload route stays at /api/upload
app.use('/api/upload', uploadRoutes);

// Map /api/jobs/* to the correct route handlers
app.use('/api/jobs', historyRoutes);     // GET / → list jobs, GET /:jobId → details, DELETE /:jobId
app.use('/api/jobs', verifyRoutes);      // POST /:jobId/start, pause, resume, cancel; GET /:jobId/results, stats

// Export: map /api/jobs/:jobId/export?status=xxx
app.get('/api/jobs/:jobId/export', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = (req.query.status as string) || 'all';
    const { getJob } = await import('./db/queries.js');
    const job = getJob(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (status === 'all') {
      const { exportFullReport } = await import('./services/csv.js');
      const filePath = await exportFullReport(jobId);
      res.download(filePath, `report_${job.filename}`);
    } else {
      const { exportResults } = await import('./services/csv.js');
      const filePath = await exportResults(jobId, status);
      res.download(filePath, `export_${status}_${job.filename}`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// Keep legacy routes for backward compatibility
app.use('/api/verify', verifyRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/history', historyRoutes);

// Serve frontend static files (production build)
const publicDir = path.resolve(__dirname, '../../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(publicDir, 'index.html'));
    }
  });
  logger.info(`Serving frontend from: ${publicDir}`);
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(config.PORT, () => {
  logger.info(`========================================`);
  logger.info(`  MailVerify Pro is running!`);
  logger.info(`  Dashboard: http://localhost:${config.PORT}`);
  logger.info(`  Database:  ${config.DB_PATH}`);
  logger.info(`========================================`);

  // Auto-open browser (cross-platform)
  const url = `http://localhost:${config.PORT}`;
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      import('child_process').then(cp => cp.exec(`start ${url}`));
    } else if (platform === 'darwin') {
      import('child_process').then(cp => cp.exec(`open ${url}`));
    } else {
      import('child_process').then(cp => cp.exec(`xdg-open ${url}`));
    }
  } catch {
    // Silently ignore if browser can't be opened
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  db.close();
  server.close(() => {
    logger.info('Server stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  db.close();
  server.close(() => {
    logger.info('Server stopped.');
    process.exit(0);
  });
});
