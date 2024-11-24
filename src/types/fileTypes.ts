export type TFileInfo = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type TFileUploadState = {
  progress: number;
  error: string | null;
  fileInfo: TFileInfo | null;
  preview: Array<Record<string, any>>;
};

export type TColumnInfo = {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  uniqueValues: number;
  missingValues: number;
};
