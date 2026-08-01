import express from 'express';
import * as queries from '../db/queries.js';

const router = express.Router();

router.get('/', (req, res) => {
  const jobs = queries.getAllJobs();
  res.json(jobs);
});

router.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = queries.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const stats = queries.getJobStats(jobId);
  res.json({ job, stats });
});

router.delete('/:jobId', (req, res) => {
  const { jobId } = req.params;
  queries.deleteJob(jobId);
  res.json({ message: 'Job deleted successfully' });
});

export default router;
