interface IDataQualityStats {
  unique_counts: Record<string, number>;
  duplicate_counts: Record<string, number>;
  missing_counts: Record<string, number>;
  null_counts: Record<string, number>;
  inconsistent_data: Record<string, any[]>;
  total_rows: number;
}

export interface IColumnInfo {
  name: string;
  type: string;
  missing_count: number;
  unique_count: number;
}

export interface IColumnResponse {
  success: boolean;
  message: string;
  data: {
    columns: string[];
    column_types: Record<string, string>;
    total_columns: number;
    column_info: IColumnInfo[];
  };
}

export interface IDatasetAnalysisProps {
  datasetId: string;
  selectedColumns: string[];
}

export interface IUploadResponse {
  success: boolean;
  dataset_id: string;
  message: string;
}
