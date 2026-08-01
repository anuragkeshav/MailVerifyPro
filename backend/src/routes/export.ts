import express from 'express';
import { exportResults, exportFullReport } from '../services/csv.js';
import * as queries from '../db/queries.js';

const router = express.Router();

router.get('/:jobId/all', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = queries.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const filePath = await exportFullReport(jobId);
    res.download(filePath, `report_${job.filename}`);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export report' });
  }
});

router.get('/:jobId/:status', async (req, res) => {
  try {
    const { jobId, status } = req.params;
    const job = queries.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const filePath = await exportResults(jobId, status);
    res.download(filePath, `export_${status}_${job.filename}`);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export results' });
  }
});

export default router;
