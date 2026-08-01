import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { db } from '../db/database.js';
import { config } from '../config/index.js';

export const parseCSV = (filePath: string): Promise<{ emails: string[], totalRows: number, duplicates: number, emptyRows: number, detectedColumn: string }> => {
  return new Promise((resolve, reject) => {
    const emails: string[] = [];
    const seenEmails = new Set<string>();
    let totalRows = 0;
    let emptyRows = 0;
    let duplicates = 0;
    let detectedColumn = '';
    let isFirstRow = true;
    let emailColumnIndex = -1;

    const parser = fs.createReadStream(filePath).pipe(parse({
      skip_empty_lines: true,
      relax_column_count: true
    }));

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        totalRows++;
        
        if (isFirstRow) {
          isFirstRow = false;
          // Detect email column
          const headers = record.map((h: string) => h.toLowerCase());
          emailColumnIndex = headers.findIndex((h: string) => 
            h.includes('email') || h.includes('e-mail') || h.includes('mail') || h.includes('address')
          );
          
          if (emailColumnIndex === -1) {
            // Try to find a column with email pattern in the first row if no header matches
            emailColumnIndex = record.findIndex((h: string) => /\S+@\S+\.\S+/.test(h));
            if (emailColumnIndex === -1) emailColumnIndex = 0; // fallback to first column
          } else {
            detectedColumn = headers[emailColumnIndex];
            continue; // Skip header row
          }
        }
        
        let email = record[emailColumnIndex];
        
        if (!email || email.trim() === '') {
          emptyRows++;
          continue;
        }
        
        email = email.trim().toLowerCase();
        
        if (seenEmails.has(email)) {
          duplicates++;
        } else {
          seenEmails.add(email);
          emails.push(email);
        }
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => {
      resolve({
        emails,
        totalRows: isFirstRow ? 0 : totalRows,
        duplicates,
        emptyRows,
        detectedColumn: detectedColumn || `Column ${emailColumnIndex + 1}`
      });
    });
  });
};

export const exportResults = (jobId: string, status?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(config.EXPORTS_DIR)) {
      fs.mkdirSync(config.EXPORTS_DIR, { recursive: true });
    }

    const fileName = `export_${jobId}${status ? '_' + status : ''}.csv`;
    const exportPath = path.join(config.EXPORTS_DIR, fileName);
    
    let query = 'SELECT email FROM emails WHERE job_id = ?';
    const params: any[] = [jobId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    const stmt = db.prepare(query);
    const emails = stmt.all(...params) as { email: string }[];
    
    const stringifier = stringify({ header: true, columns: ['email'] });
    const writableStream = fs.createWriteStream(exportPath);
    
    stringifier.pipe(writableStream);
    emails.forEach(row => stringifier.write({ email: row.email }));
    stringifier.end();
    
    writableStream.on('finish', () => resolve(exportPath));
    writableStream.on('error', (err) => reject(err));
  });
};

export const exportFullReport = (jobId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(config.EXPORTS_DIR)) {
      fs.mkdirSync(config.EXPORTS_DIR, { recursive: true });
    }

    const fileName = `report_${jobId}.csv`;
    const exportPath = path.join(config.EXPORTS_DIR, fileName);
    
    const stmt = db.prepare('SELECT email, status, confidence, mx_host, smtp_code, smtp_message, is_disposable, is_role, is_catch_all, reason, verification_time_ms FROM emails WHERE job_id = ?');
    const records = stmt.all(jobId) as any[];
    
    const columns = ['email', 'status', 'confidence', 'mx_host', 'smtp_code', 'smtp_message', 'is_disposable', 'is_role', 'is_catch_all', 'reason', 'verification_time_ms'];
    const stringifier = stringify({ header: true, columns });
    const writableStream = fs.createWriteStream(exportPath);
    
    stringifier.pipe(writableStream);
    records.forEach(record => stringifier.write(record));
    stringifier.end();
    
    writableStream.on('finish', () => resolve(exportPath));
    writableStream.on('error', (err) => reject(err));
  });
};
