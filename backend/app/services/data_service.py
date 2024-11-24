from fastapi import HTTPException, UploadFile
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

from ..models.data_models import (
    ColumnAnalysis,
    DatasetSummary,
    ColumnInfo,
    DatasetMetadata,
    DataPreview,
    DatasetAnalysis,
    MissingValueInfo
)

class DataService:
    def __init__(self):
        self.UPLOAD_DIR = Path("data/uploads")
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
        self.MAX_PREVIEW_ROWS = 5
        self.datasets: Dict[str, pd.DataFrame] = {}

    async def upload_file(self, file: UploadFile) -> Dict[str, Any]:
        """Handle file upload and initial processing"""
        try:
            # Validate file extension
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in self.ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format. Allowed formats: {', '.join(self.ALLOWED_EXTENSIONS)}"
                )

            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{timestamp}_{file.filename}"
            file_path = self.UPLOAD_DIR / safe_filename

            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            # Read and validate data
            try:
                if file_extension == '.csv':
                    df = pd.read_csv(file_path)
                else:
                    df = pd.read_excel(file_path)
            except Exception as e:
                file_path.unlink()  # Delete file if reading fails
                raise HTTPException(
                    status_code=400,
                    detail=f"Error reading file: {str(e)}"
                )

            # Store dataset in memory
            self.datasets[safe_filename] = df

            # Generate initial analysis
            analysis = await self.analyze_dataset(df)

            return {
                "success": True,
                "dataset_id": safe_filename,
                "filename": file.filename,
                "rows": len(df),
                "columns": len(df.columns),
                "analysis": analysis
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def analyze_dataset(self, df: pd.DataFrame) -> DatasetAnalysis:
        """Generate basic analysis of the dataset"""
        try:
            # Calculate basic statistics for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            basic_stats = {}
            for col in numeric_cols:
                basic_stats[col] = {
                    "mean": float(df[col].mean()),
                    "median": float(df[col].median()),
                    "std": float(df[col].std()),
                    "min": float(df[col].min()),
                    "max": float(df[col].max())
                }

            # Calculate missing values for all columns
            missing_values = {}
            for col in df.columns:
                missing_count = int(df[col].isna().sum())
                missing_values[col] = MissingValueInfo(
                    count=missing_count,
                    percentage=float(missing_count / len(df) * 100)
                )

            # Get column analyses
            column_analyses = {}
            for col in df.columns:
                try:
                    basic_stats_col = {
                        "count": int(len(df[col])),
                        "unique_values": int(df[col].nunique()),
                        "missing_values": int(df[col].isna().sum()),
                        "missing_percentage": float(df[col].isna().sum() / len(df[col]) * 100)
                    }
                    
                    analysis_dict = {"basic_stats": basic_stats_col}
                    
                    if pd.api.types.is_numeric_dtype(df[col]):
                        analysis_dict["numeric_stats"] = {
                            "mean": float(df[col].mean()),
                            "median": float(df[col].median()),
                            "std": float(df[col].std()),
                            "min": float(df[col].min()),
                            "max": float(df[col].max())
                        }
                    else:
                        analysis_dict["categorical_stats"] = {
                            "most_common": df[col].value_counts().head(5).to_dict(),
                            "least_common": df[col].value_counts().tail(5).to_dict()
                        }
                    
                    column_analyses[col] = ColumnAnalysis(**analysis_dict)
                except Exception as e:
                    print(f"Error analyzing column {col}: {str(e)}")
                    continue

            return DatasetAnalysis(
                basic_statistics=basic_stats,
                missing_values=missing_values,
                total_rows=len(df),
                total_columns=len(df.columns),
                column_analyses=column_analyses
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_dataset(self, dataset_id: str) -> pd.DataFrame:
        """Retrieve dataset by ID"""
        if dataset_id not in self.datasets:
            file_path = self.UPLOAD_DIR / dataset_id
            if not file_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Dataset '{dataset_id}' not found"
                )
            
            # Load dataset from file
            try:
                if str(file_path).endswith('.csv'):
                    df = pd.read_csv(file_path)
                else:
                    df = pd.read_excel(file_path)
                self.datasets[dataset_id] = df
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error loading dataset: {str(e)}"
                )

        return self.datasets[dataset_id]

    async def get_dataset_preview(self, dataset_id: str, rows: int = 5) -> Dict[str, Any]:
        """Get preview of dataset"""
        df = await self.get_dataset(dataset_id)
        preview_df = df.head(rows)
        
        return {
            "columns": list(df.columns),
            "data": preview_df.to_dict(orient='records'),
            "total_rows": len(df)
        }

    async def get_column_stats(self, dataset_id: str, column_name: str) -> Dict[str, Any]:
        """Get detailed statistics for a specific column"""
        df = await self.get_dataset(dataset_id)
        
        if column_name not in df.columns:
            raise HTTPException(
                status_code=404,
                detail=f"Column '{column_name}' not found"
            )

        series = df[column_name]
        stats = {
            "missing_count": int(series.isna().sum()),
            "unique_count": int(series.nunique())
        }

        if pd.api.types.is_numeric_dtype(series):
            stats.update({
                "mean": float(series.mean()),
                "median": float(series.median()),
                "std": float(series.std()),
                "min": float(series.min()),
                "max": float(series.max()),
                "quartiles": {
                    "25": float(series.quantile(0.25)),
                    "50": float(series.quantile(0.50)),
                    "75": float(series.quantile(0.75))
                }
            })
        elif pd.api.types.is_categorical_dtype(series) or series.dtype == 'object':
            value_counts = series.value_counts()
            stats.update({
                "most_common": value_counts.head(5).to_dict(),
                "least_common": value_counts.tail(5).to_dict()
            })

        return stats

    async def delete_dataset(self, dataset_id: str) -> Dict[str, Any]:
        """Delete dataset and associated files"""
        try:
            # Remove from memory
            if dataset_id in self.datasets:
                del self.datasets[dataset_id]

            # Remove file
            file_path = self.UPLOAD_DIR / dataset_id
            if file_path.exists():
                file_path.unlink()

            return {
                "success": True,
                "message": f"Dataset '{dataset_id}' deleted successfully"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error deleting dataset: {str(e)}"
            )

    async def list_datasets(self) -> List[Dict[str, Any]]:
        """List all available datasets"""
        try:
            datasets = []
            for file_path in self.UPLOAD_DIR.glob('*'):
                if file_path.suffix.lower() in self.ALLOWED_EXTENSIONS:
                    stats = file_path.stat()
                    datasets.append({
                        "id": file_path.name,
                        "filename": file_path.name,
                        "size": stats.st_size,
                        "created": datetime.fromtimestamp(stats.st_ctime).isoformat(),
                        "modified": datetime.fromtimestamp(stats.st_mtime).isoformat()
                    })
            return datasets
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error listing datasets: {str(e)}"
            )
