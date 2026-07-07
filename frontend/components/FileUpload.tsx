'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/csvParse';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  error?: string;
}

export default function FileUpload({ onFileSelect, error }: FileUploadProps) {
  const [selected, setSelected] = useState<File | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        setSelected(accepted[0]);
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(null);
  };

  if (selected) {
    return (
      <Card className="flex items-center gap-4 px-4 py-3 bg-card w-fit border-border">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{selected.name}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(selected.size)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
        >
          Remove
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={[
          'cursor-pointer border-2 border-dashed rounded-lg py-12 px-8 flex flex-col items-center justify-center gap-3 transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className={[
            'w-8 h-8 transition-colors',
            isDragActive ? 'text-primary' : 'text-muted-foreground',
          ].join(' ')}
        />
        <div className="text-center flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop your CSV file here…'
              : 'Drag & drop your CSV file here'}
          </p>
          {!isDragActive && (
            <Button variant="outline" size="sm" type="button" className="mt-1">
              Browse files
            </Button>
          )}
          <p className="text-xs text-muted-foreground/85">.csv files only (Max 5MB)</p>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
