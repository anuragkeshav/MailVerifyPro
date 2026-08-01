import express from 'express';
import { processJob, pauseJob, resumeJob, cancelJob } from '../services/queue.js';
import * as queries from '../db/queries.js';

const router = express.Router();

router.post('/:jobId/start', (req, res) => {
  const { jobId } = req.params;
  const job = queries.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  processJob(jobId);
  res.json({ message: 'Job started' });
});

router.post('/:jobId/pause', (req, res) => {
  const { jobId } = req.params;
  pauseJob(jobId);
  res.json({ message: 'Job paused' });
});

router.post('/:jobId/resume', (req, res) => {
  const { jobId } = req.params;
  resumeJob(jobId);
  res.json({ message: 'Job resumed' });
});

router.post('/:jobId/cancel', (req, res) => {
  const { jobId } = req.params;
  cancelJob(jobId);
  res.json({ message: 'Job cancelled' });
});

router.get('/:jobId/results', (req, res) => {
  const { jobId } = req.params;
  const { status, search, page = 1, limit = 50 } = req.query;
  
  const results = queries.getEmailsByJob(jobId, {
    status: status as string,
    search: search as string,
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10)
  });
  
  res.json(results);
});

router.get('/:jobId/stats', (req, res) => {
  const { jobId } = req.params;
  const stats = queries.getJobStats(jobId);
  res.json(stats);
});

export default router;
