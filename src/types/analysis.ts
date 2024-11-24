export interface IBasicStatistics {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  '25%': number;
  '50%': number;
  '75%': number;
}

export interface IMissingValues {
  count: Record<string, number>;
  percentage: Record<string, number>;
}

export interface IQualityAnalysis {
  unique_counts: Record<string, number>;
  duplicate_counts: Record<string, number>;
  missing_counts: Record<string, number>;
  null_counts: Record<string, number>;
  inconsistent_data: Record<string, any[]>;
  total_rows: number;
}

export interface IDatasetDescription {
  basic_statistics: Record<string, IBasicStatistics>;
  missing_values: IMissingValues;
  total_rows: number;
  total_columns: number;
}
