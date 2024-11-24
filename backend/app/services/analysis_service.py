import pandas as pd
import numpy as np
from fastapi import HTTPException
from typing import Dict, List, Any
from ..models.data_models import AnalysisResult
from ..utils.file_handlers import read_dataset
from pathlib import Path
from ..services.file_service import FileService

class AnalysisService:
    def __init__(self):
        self.UPLOAD_DIR = Path("data/uploads")
        self.datasets: Dict[str, pd.DataFrame] = {}
        self.file_service = FileService()
        self.column_analyses: Dict[str, Dict[str, Any]] = {}

    def _convert_to_native_types(self, value: Any) -> Any:
        """Convert numpy types to native Python types"""
        if isinstance(value, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64)):
            return int(value)
        elif isinstance(value, (np.float_, np.float16, np.float32, np.float64)):
            return float(value)
        elif isinstance(value, np.bool_):
            return bool(value)
        elif isinstance(value, np.ndarray):
            return self._convert_to_native_types(value.tolist())
        elif isinstance(value, dict):
            return {k: self._convert_to_native_types(v) for k, v in value.items()}
        elif isinstance(value, (list, tuple)):
            return [self._convert_to_native_types(item) for item in value]
        return value

    async def get_column_names(self, dataset_id: str) -> Dict[str, Any]:
        """
        Get column names in different formats
        """
        try:
            # Get dataset using file service
            df = await self.file_service.get_stored_dataset(dataset_id)
            
            if df is None:
                # If not in memory, try reading from file
                file_path = self.UPLOAD_DIR / dataset_id
                if not file_path.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Dataset '{dataset_id}' not found"
                    )
                df = pd.read_csv(file_path) if str(file_path).endswith('.csv') else pd.read_excel(file_path)
            
            columns = df.columns.tolist()
            column_types = {col: str(df[col].dtype) for col in columns}
            
            return {
                "success": True,
                "message": "Columns retrieved successfully",
                "data": {
                    "columns": columns,
                    "column_types": column_types,
                    "total_columns": len(columns),
                    "column_info": [
                        {
                            "name": col,
                            "type": str(df[col].dtype),
                            "missing_count": int(df[col].isna().sum()),
                            "unique_count": int(df[col].nunique())
                        } for col in columns
                    ]
                }
            }
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error retrieving columns: {str(e)}"
            )

    async def get_dataset_description(self, dataset_id: str) -> Dict[str, Any]:
        try:
            file_path = self.UPLOAD_DIR / dataset_id
            df = read_dataset(file_path)
            
            # Get basic statistics using describe()
            description = df.describe().to_dict()
            
            # Get missing values information
            missing_values = df.isnull().sum().to_dict()
            
            # Calculate percentage of missing values
            missing_percentage = (df.isnull().sum() / len(df) * 100).to_dict()
            
            return {
                "basic_statistics": description,
                "missing_values": {
                    "count": missing_values,
                    "percentage": missing_percentage
                },
                "total_rows": len(df),
                "total_columns": len(df.columns)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error analyzing dataset: {str(e)}")

    async def analyze_column(self, dataset_id: str, column_name: str, analysis_type: str) -> AnalysisResult:
        try:
            file_path = self.UPLOAD_DIR / dataset_id
            df = read_dataset(file_path)
            
            if column_name not in df.columns:
                raise HTTPException(
                    status_code=404,
                    detail=f"Column '{column_name}' not found in dataset"
                )
            
            column_data = df[column_name]
            result = {}
            
            # Basic statistics for all types
            result["basic_stats"] = {
                "basic_statistics": {
                    "count": int(len(column_data)),
                    "unique_values": int(column_data.nunique()),
                    "missing_values": int(column_data.isna().sum()),
                    "missing_percentage": float(column_data.isna().sum() / len(column_data) * 100)
                }
            }
            
            # Type-specific analysis
            if pd.api.types.is_numeric_dtype(column_data):
                numeric_stats = {
                    "mean": column_data.mean(),
                    "median": column_data.median(),
                    "std": column_data.std(),
                    "min": column_data.min(),
                    "max": column_data.max(),
                    "quartiles": {
                        "25%": column_data.quantile(0.25),
                        "50%": column_data.quantile(0.50),
                        "75%": column_data.quantile(0.75)
                    },
                    "skewness": column_data.skew(),
                    "kurtosis": column_data.kurtosis()
                }
                result["numeric_stats"] = self._convert_to_native_types(numeric_stats)
            
            elif pd.api.types.is_categorical_dtype(column_data) or column_data.dtype == 'object':
                value_counts = column_data.value_counts()
                categorical_stats = {
                    "most_common_values": value_counts.head(5).to_dict(),
                    "least_common_values": value_counts.tail(5).to_dict(),
                    "value_distribution": (value_counts / len(column_data) * 100).head(5).to_dict()
                }
                result["categorical_stats"] = self._convert_to_native_types(categorical_stats)
            
            return AnalysisResult(
                column_name=column_name,
                analysis_type=analysis_type,
                result=result
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def analyze_all_columns(self, dataset_id: str) -> Dict[str, Any]:
        """Analyze all columns in a dataset"""
        try:
            # Get dataset
            df = await self.file_service.get_stored_dataset(dataset_id)
            if df is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Dataset '{dataset_id}' not found"
                )
            
            columns = df.columns.tolist()
            analysis_results = {}
            
            for column in columns:
                try:
                    result = await self.analyze_column(dataset_id, column, "full")
                    analysis_results[column] = result
                except Exception as e:
                    print(f"Error analyzing column {column}: {str(e)}")
                    continue
            
            # Store analysis results in memory or database
            self.column_analyses[dataset_id] = analysis_results
            
            return {
                "success": True,
                "dataset_id": dataset_id,
                "total_columns": len(columns),
                "analyzed_columns": len(analysis_results),
                "column_analyses": analysis_results
            }
            
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing dataset columns: {str(e)}"
            )

    async def analyze_data_quality(self, dataset_id: str) -> Dict[str, Any]:
        """Analyze data quality issues in the dataset"""
        try:
            # Get dataset
            df = await self.file_service.get_stored_dataset(dataset_id)
            if df is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Dataset '{dataset_id}' not found"
                )
            
            # Initialize results dictionary
            quality_analysis = {
                "unique_counts": {},
                "duplicate_counts": {},
                "missing_counts": {},
                "null_counts": {},
                "total_rows": len(df)
            }
            
            # Analyze each column
            for column in df.columns:
                # Calculate unique values (excluding NaN/None/empty)
                non_null_mask = ~(df[column].isna() | (df[column].astype(str).str.strip() == ''))
                non_null_values = df.loc[non_null_mask, column]
                quality_analysis["unique_counts"][column] = int(non_null_values.nunique())
                
                # Calculate duplicate values
                value_counts = non_null_values.value_counts()
                duplicates = value_counts[value_counts > 1].sum() - len(value_counts[value_counts > 1])
                quality_analysis["duplicate_counts"][column] = int(duplicates)
                
                # Calculate missing values (NaN, None, empty strings)
                missing_mask = (
                    df[column].isna() | 
                    (df[column].astype(str).str.strip() == '') | 
                    (df[column].isnull())
                )
                quality_analysis["missing_counts"][column] = int(missing_mask.sum())
                
                # Calculate null values (specifically NaN and None)
                null_mask = df[column].isnull()
                quality_analysis["null_counts"][column] = int(null_mask.sum())
            
            return {
                "success": True,
                "quality_analysis": quality_analysis
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )
