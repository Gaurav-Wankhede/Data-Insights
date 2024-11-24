from fastapi import APIRouter, UploadFile, File, Depends, Query, HTTPException
from typing import Dict, Any
import os

from ..services.file_service import FileService
from ..services.data_service import DataService
from ..services.analysis_service import AnalysisService

router = APIRouter()
file_service = FileService()
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    data_service: DataService = Depends(),
    analysis_service: AnalysisService = Depends()
):
    """Upload a file and analyze its columns"""
    try:
        # Validate file exists
        if not file or not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided"
            )

        # Create upload directory if it doesn't exist
        os.makedirs("data/uploads", exist_ok=True)

        # Handle file upload
        upload_result = await data_service.upload_file(file)
        
        if not upload_result or "dataset_id" not in upload_result:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload file"
            )
            
        dataset_id = upload_result["dataset_id"]
        
        # Get analysis results from the upload_result instead of analyzing again
        analysis_results = upload_result.get("analysis")
        
        # Format basic statistics as dictionary of dictionaries
        if isinstance(analysis_results, dict) and "basic_statistics" in analysis_results:
            basic_stats = analysis_results["basic_statistics"]
            analysis_results["basic_statistics"] = {
                col: {
                    "count": stats["count"],
                    "unique_values": stats["unique_values"],
                    "missing_values": stats["missing_values"],
                    "missing_percentage": stats["missing_percentage"]
                }
                for col, stats in basic_stats.items()
            }
        
        return {
            "success": True,
            "message": "File uploaded and analyzed successfully",
            "dataset_info": upload_result,
            "analysis_results": analysis_results
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during upload and analysis: {str(e)}"
        )

@router.get("/datasets")
async def list_datasets():
    """
    Get a list of all available datasets
    
    Returns:
    - List of datasets with basic information
    """
    try:
        return await file_service.list_datasets()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing datasets: {str(e)}"
        )

@router.get("/head/{dataset_id}")
async def get_dataset_head(
    dataset_id: str,
    n_rows: int = Query(default=10, le=100, ge=1, description="Number of rows to return")
) -> Dict[str, Any]:
    """
    Get the first n rows of a dataset
    
    Parameters:
    - dataset_id: ID of the dataset
    - n_rows: Number of rows to return (default: 10, max: 100)
    """
    try:
        result = await file_service.get_dataset_head(dataset_id, n_rows)
        if result is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Dataset '{dataset_id}' not found"
            )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving dataset head: {str(e)}"
        )

