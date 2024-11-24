from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np

class DatasetMetadata(BaseModel):
    filename: str
    row_count: int
    column_count: int
    file_size: int
    creation_date: str
    missing_cells: int
    duplicate_rows: int

class ColumnInfo(BaseModel):
    name: str
    type: str
    stats: Dict[str, Any]

class DataPreview(BaseModel):
    headers: List[str]
    rows: List[List[Any]]
    total_rows: int

class DatasetSummary(BaseModel):
    metadata: DatasetMetadata
    columns: List[ColumnInfo]
    preview: DataPreview

class AnalysisResult(BaseModel):
    column_name: str
    analysis_type: str
    result: Dict[str, Any]
    
    class Config:
        json_encoders = {
            np.float64: float,
            np.int64: int
        }

class VisualizationRequest(BaseModel):
    dataset_id: str
    chart_type: str
    x_column: str
    y_column: Optional[str]
    additional_params: Optional[dict]

class MissingValueInfo(BaseModel):
    count: int
    percentage: float  # Changed from int to float

class ColumnAnalysis(BaseModel):
    basic_stats: Dict[str, Any]
    numeric_stats: Optional[Dict[str, Any]]
    categorical_stats: Optional[Dict[str, Any]]
    
    class Config:
        json_encoders = {
            np.float64: float,
            np.int64: int
        }

class DatasetAnalysis(BaseModel):
    basic_statistics: Dict[str, Dict[str, float]]
    missing_values: Dict[str, MissingValueInfo]
    total_rows: int
    total_columns: int
    column_analyses: Optional[Dict[str, ColumnAnalysis]]

    class Config:
        json_encoders = {
            np.float64: float,
            np.int64: int
        }

class DataQualityAnalysis(BaseModel):
    unique_counts: Dict[str, int]
    duplicate_counts: Dict[str, int]
    missing_counts: Dict[str, int]
    null_counts: Dict[str, int]
    inconsistent_data: Dict[str, List[Any]]
    total_rows: int
    
    class Config:
        json_encoders = {
            np.float64: float,
            np.int64: int
        }
