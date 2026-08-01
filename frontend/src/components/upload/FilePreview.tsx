import { UploadResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  uploadData: UploadResponse;
  onStart: () => void;
}

export function FilePreview({ uploadData, onStart }: FilePreviewProps) {
  const { filename, totalRows, emailColumn, preview } = uploadData;

  // We assume preview data includes headers as first row if available, or just data rows.
  // For safety, let's just render the preview matrix.
  const headers = preview.length > 0 ? preview[0] : [];
  const rows = preview.slice(1, 6); // Show next 5 rows
  const emailColIndex = headers.findIndex(h => h.toLowerCase().includes('email') || h === emailColumn);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ready to Verify</h2>
          <p className="text-muted-foreground">
            {filename} • {totalRows.toLocaleString()} rows detected
          </p>
        </div>
        <Button size="lg" onClick={onStart} className="w-full sm:w-auto shadow-md">
          <Play className="mr-2 h-4 w-4" /> Start Verification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            We detected <span className="font-semibold text-foreground">"{emailColumn}"</span> as the primary email column.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {headers.map((header, i) => (
                    <TableHead 
                      key={i}
                      className={cn(
                        i === emailColIndex && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      {header || `Column ${i+1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell 
                        key={cellIndex}
                        className={cn(
                          "max-w-[200px] truncate",
                          cellIndex === emailColIndex && "font-medium"
                        )}
                        title={cell}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {preview.length > 6 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing 5 of {totalRows.toLocaleString()} rows
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
