import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useFileUpload(onUploadSuccess: (file: File) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith('.csv') &&
      !selectedFile.name.endsWith('.txt')
    ) {
      toast.error('Only CSV and TXT files are supported');
      return;
    }

    setFile(selectedFile);

    // Read first few lines for preview (client-side simple parse)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split('\n').slice(0, 10);
        const rows = lines.map(line => line.split(',').map(c => c.trim()));
        setPreview(rows.filter(row => row.length > 0 && row.some(cell => cell !== '')));
      }
    };
    reader.readAsText(selectedFile.slice(0, 5000)); // Read max 5KB for preview

  }, []);

  const upload = useCallback(() => {
    if (file) {
      onUploadSuccess(file);
    }
  }, [file, onUploadSuccess]);

  const reset = useCallback(() => {
    setFile(null);
    setPreview([]);
  }, []);

  return {
    file,
    preview,
    onDrop,
    upload,
    reset
  };
}
