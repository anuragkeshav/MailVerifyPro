import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as queries from '../db/queries.js';
import { parseCSV } from '../services/csv.js';
import { JobStatus, ProgressData } from '../types/index.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv' && ext !== '.txt') {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only .csv and .txt files are allowed' });
    }

    const { emails, totalRows, duplicates, emptyRows, detectedColumn } = await parseCSV(file.path);
    
    // Clean up temp file
    fs.unlinkSync(file.path);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid emails found in file' });
    }

    const jobId = uuidv4();
    const progressData: ProgressData = {
      processed: 0,
      total: emails.length,
      valid: 0,
      invalid: 0,
      risky: 0,
      catchAll: 0,
      unknown: 0,
      speed: 0,
      eta: 0
    };

    const job = {
      id: jobId,
      filename: file.originalname,
      totalEmails: emails.length,
      duplicatesRemoved: duplicates,
      emptyRows: emptyRows,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString(),
      progressData
    };

    queries.createJob(job);
    queries.insertEmails(jobId, emails);

    res.status(201).json({ 
      jobId, 
      filename: file.originalname,
      totalRows: totalRows,
      emailColumn: detectedColumn || 'email',
      preview: [
        [detectedColumn || 'email'],
        ...emails.slice(0, 10).map(e => [e])
      ],
      message: 'File processed successfully', 
      stats: { totalRows, duplicates, emptyRows, validEmails: emails.length, detectedColumn }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

export default router;
