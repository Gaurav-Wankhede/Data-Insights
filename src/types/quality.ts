export interface IQualityStats {
  unique_counts: Record<string, number>;
  duplicate_counts: Record<string, number>;
  missing_counts: Record<string, number>;
  null_counts: Record<string, number>;
  inconsistent_data: Record<string, any[]>;
  total_rows: number;
}

export interface IQualityResponse {
  success: boolean;
  dataset_id: string;
  quality_analysis: IQualityStats;
}
