import pandas as pd
import numpy as np
from fastapi import UploadFile, HTTPException
from pathlib import Path
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime

from ..models.data_models import (
    DatasetSummary,
    ColumnInfo,
    DatasetMetadata,
    DataPreview
)
from ..utils.file_handlers import save_uploaded_file, read_file_content
from ..utils.data_validation import validate_dataset

class FileService:
    def __init__(self):
        self.UPLOAD_DIR = Path("data/uploads")
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
        self.MAX_PREVIEW_ROWS = 5
        self.datasets_info = {}  # Store dataset information
        
    async def process_file(self, file: UploadFile) -> DatasetSummary:
        """
        Process uploaded file and generate dataset summary
        """
        try:
            # Validate file extension
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in self.ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format. Allowed formats: {', '.join(self.ALLOWED_EXTENSIONS)}"
                )

            # Save file and get path
            file_path = await save_uploaded_file(file, self.UPLOAD_DIR)
            
            # Read file content
            df = await read_file_content(file_path, file_extension)
            
            # Generate dataset metadata
            metadata = await self._generate_metadata(df, file.filename)
            
            # Generate column information
            columns = await self._analyze_columns(df)
            
            # Generate data preview
            preview = await self._generate_preview(df)

            summary = DatasetSummary(
                metadata=metadata,
                columns=columns,
                preview=preview
            )
            
            # Store dataset information
            dataset_id = Path(file_path).name
            self.datasets_info[dataset_id] = {
                'summary': summary,
                'file_path': file_path,
                'dataframe': df  # Store the DataFrame for future use
            }
            
            return summary
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def _generate_metadata(self, df: pd.DataFrame, filename: str) -> DatasetMetadata:
        """
        Generate metadata for the dataset
        """
        return DatasetMetadata(
            filename=filename,
            row_count=len(df),
            column_count=len(df.columns),
            file_size=0,  # You can add actual file size calculation if needed
            creation_date=datetime.now().isoformat(),
            missing_cells=df.isna().sum().sum(),
            duplicate_rows=len(df) - len(df.drop_duplicates())
        )

    async def _analyze_columns(self, df: pd.DataFrame) -> List[ColumnInfo]:
        """
        Analyze columns and generate column information
        """
        columns = []
        for column in df.columns:
            series = df[column]
            col_type = self._determine_column_type(series)
            
            stats = {
                "unique_count": int(series.nunique()),
                "missing_count": int(series.isna().sum()),
                "missing_percentage": float(series.isna().sum() / len(series) * 100)
            }
            
            if col_type == "numeric":
                stats.update({
                    "mean": float(series.mean()),
                    "std": float(series.std()),
                    "min": float(series.min()),
                    "max": float(series.max())
                })
            elif col_type in ["categorical", "text"]:
                value_counts = series.value_counts()
                stats.update({
                    "most_common": value_counts.head(5).to_dict()
                })
            
            columns.append(ColumnInfo(
                name=column,
                type=col_type,
                stats=stats
            ))
        
        return columns

    def _determine_column_type(self, series: pd.Series) -> str:
        """
        Determine the type of a column
        """
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        elif series.nunique() / len(series) < 0.5:  # If less than 50% unique values
            return "categorical"
        else:
            return "text"

    async def _generate_preview(self, df: pd.DataFrame) -> DataPreview:
        """
        Generate a preview of the dataset
        """
        preview_df = df.head(self.MAX_PREVIEW_ROWS)
        
        return DataPreview(
            headers=list(df.columns),
            rows=preview_df.values.tolist(),
            total_rows=len(df)
        )

    async def get_stored_dataset(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """
        Retrieve stored dataset DataFrame
        """
        try:
            if dataset_id in self.datasets_info:
                return self.datasets_info[dataset_id]['dataframe']
            
            file_path = self.UPLOAD_DIR / dataset_id
            if not file_path.exists():
                return None
            
            # Read the file based on extension
            df = pd.read_csv(file_path) if str(file_path).endswith('.csv') else pd.read_excel(file_path)
            
            # Store in memory for future use
            self.datasets_info[dataset_id] = {
                'dataframe': df,
                'file_path': file_path
            }
            
            return df
        except Exception as e:
            print(f"Error reading dataset: {str(e)}")
            return None

    async def get_dataset_summary(self, dataset_id: str) -> Optional[DatasetSummary]:
        """
        Retrieve stored dataset summary
        """
        if dataset_id in self.datasets_info:
            return self.datasets_info[dataset_id]['summary']
        return None

    async def delete_dataset(self, dataset_id: str) -> bool:
        """
        Delete dataset and its stored information
        """
        try:
            if dataset_id in self.datasets_info:
                # Delete file
                file_path = self.datasets_info[dataset_id]['file_path']
                if file_path.exists():
                    file_path.unlink()
                # Remove from storage
                del self.datasets_info[dataset_id]
                return True
            return False
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def list_datasets(self) -> List[Dict[str, Any]]:
        """
        List all available datasets with their basic information
        """
        try:
            datasets = []
            for file_path in self.UPLOAD_DIR.glob('*'):
                if file_path.suffix.lower() in self.ALLOWED_EXTENSIONS:
                    try:
                        # Read basic info without loading entire dataset
                        df = pd.read_csv(file_path, nrows=1) if file_path.suffix == '.csv' else pd.read_excel(file_path, nrows=1)
                        
                        datasets.append({
                            "id": file_path.name,
                            "filename": file_path.name,
                            "size": file_path.stat().st_size,
                            "created": datetime.fromtimestamp(file_path.stat().st_ctime).isoformat(),
                            "columns": len(df.columns),
                            "format": file_path.suffix[1:].upper()  # Remove dot and capitalize
                        })
                    except Exception as e:
                        continue  # Skip files that can't be read
                        
            return sorted(datasets, key=lambda x: x['created'], reverse=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error listing datasets: {str(e)}")

    async def get_dataset_head(self, dataset_id: str, n_rows: int = 10) -> Dict[str, Any]:
        """
        Get the first n rows of a dataset
        """
        try:
            # First try to get from memory
            df = await self.get_stored_dataset(dataset_id)
            
            if df is None:
                # If not in memory, try reading from file
                file_path = self.UPLOAD_DIR / dataset_id
                if not file_path.exists():
                    return None
                    
                # Read the file based on extension
                df = pd.read_csv(file_path) if str(file_path).endswith('.csv') else pd.read_excel(file_path)
                
                # Store in memory for future use
                self.datasets_info[dataset_id] = {
                    'dataframe': df,
                    'file_path': file_path
                }
            
            head_data = df.head(n_rows)
            
            # Convert data to dictionary format for each column
            basic_statistics = {}
            for column in df.columns:
                basic_statistics[column] = {
                    "count": int(df[column].count()),
                    "unique_values": int(df[column].nunique()),
                    "missing_values": int(df[column].isna().sum()),
                    "missing_percentage": float(df[column].isna().sum() / len(df) * 100)
                }
            
            return {
                "success": True,
                "columns": list(head_data.columns),
                "data": head_data.values.tolist(),
                "total_rows": len(df),
                "preview": head_data.to_dict(orient='records'),
                "basic_statistics": basic_statistics
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error retrieving dataset head: {str(e)}"
            )
