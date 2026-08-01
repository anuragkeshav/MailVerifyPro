import { useDropzone } from 'react-dropzone';
import { Upload, FileType } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileDropzoneProps {
  onUploadSuccess: (file: File) => void;
  isUploading: boolean;
}

export function FileDropzone({ onUploadSuccess, isUploading }: FileDropzoneProps) {
  const { file, onDrop, upload, reset } = useFileUpload(onUploadSuccess);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div 
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          (file || isUploading) && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <motion.div 
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="bg-primary/10 p-4 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">
              Drag & drop your CSV file here
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse from your computer
            </p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-4">
            <FileType className="h-3 w-3" />
            Supports .csv and .txt files containing email addresses
          </div>
        </motion.div>
      </div>

      {file && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 flex items-center justify-between bg-card border rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary/10 p-2 rounded-md shrink-0">
              <FileType className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={reset} disabled={isUploading}>
              Cancel
            </Button>
            <Button size="sm" onClick={upload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Process File'}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
