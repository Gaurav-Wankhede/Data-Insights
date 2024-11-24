import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DataService } from "@/services/api";

interface FileUploadProps {
  onUploadSuccess: (datasetId: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await DataService.uploadFile(file);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess(data.dataset_id);
      toast({
        title: "Success",
        description: "File uploaded successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full p-6">
      <div className="flex flex-col items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors"
        >
          {isUploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <span className="text-lg font-semibold">Drop your file here</span>
              <span className="text-sm text-muted-foreground">or click to browse</span>
            </>
          )}
        </label>
        <p className="text-sm text-muted-foreground">
          Supported formats: CSV, Excel (.xlsx, .xls)
        </p>
      </div>
    </Card>
  );
};
