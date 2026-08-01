import { Job } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryTableProps {
  jobs: Job[];
  onViewJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  isLoading?: boolean;
}

export function HistoryTable({ jobs, onViewJob, onDeleteJob }: HistoryTableProps) {
  
  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">Completed</Badge>;
      case 'failed': return <Badge className="bg-red-500/15 text-red-600 border-red-500/20">Failed</Badge>;
      case 'processing': return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20">Processing</Badge>;
      case 'paused': return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20">Paused</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
  };

  if (jobs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="text-muted-foreground space-y-2">
          <p className="text-lg font-medium">No verification history yet</p>
          <p className="text-sm">Upload a file to start verifying emails and see your history here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Emails</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job, idx) => (
              <motion.tr
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group border-b transition-colors hover:bg-muted/50"
              >
                <TableCell className="font-medium">{job.filename}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{job.stats.total.toLocaleString()}</span>
                    {job.status === 'processing' && (
                      <span className="text-xs text-muted-foreground">
                        {job.stats.processed.toLocaleString()} processed
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(job.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onViewJob(job.id)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this job?')) {
                          onDeleteJob(job.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
