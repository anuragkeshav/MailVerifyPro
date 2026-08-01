import { EmailResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
  results: EmailResult[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onFilterChange: (filter: string) => void;
  isLoading?: boolean;
}

export function ResultsTable({
  results,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onFilterChange,
  isLoading
}: ResultsTableProps) {
  const totalPages = Math.ceil(totalCount / 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid': return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">Valid</Badge>;
      case 'invalid': return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20">Invalid</Badge>;
      case 'risky': return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20">Risky</Badge>;
      case 'catch-all': return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20">Catch-All</Badge>;
      default: return <Badge className="bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 border-gray-500/20">Unknown</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-500';
    if (confidence >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search emails..." 
            className="pl-9"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Select defaultValue="all" onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
            <SelectItem value="risky">Risky</SelectItem>
            <SelectItem value="catch-all">Catch-All</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>MX Host</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              results.map((result, idx) => (
                <motion.tr
                  key={`${result.email}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <TableCell className="font-medium">{result.email}</TableCell>
                  <TableCell>{getStatusBadge(result.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-sm">{result.confidence}%</span>
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", getConfidenceColor(result.confidence))} 
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{result.mx_host || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]" title={result.reason}>
                    {result.reason || '-'}
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border-t flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {Math.min(results.length, 10)} of {totalCount} results
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">Page {currentPage} of {totalPages || 1}</span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
