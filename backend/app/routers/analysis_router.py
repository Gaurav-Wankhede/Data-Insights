from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, List, Any
from ..models.data_models import AnalysisResult
from ..services.analysis_service import AnalysisService

router = APIRouter()
analysis_service = AnalysisService()

@router.post("/analyze/{dataset_id}/{column_name}")
async def analyze_column(
    dataset_id: str,
    column_name: str,
    analysis_type: str = Query("full", description="Type of analysis to perform (full, basic, numeric, categorical)")
) -> AnalysisResult:
    """
    Analyze a specific column in the dataset
    
    Parameters:
    - dataset_id: ID of the dataset to analyze
    - column_name: Name of the column to analyze
    - analysis_type: Type of analysis to perform (default: "full")
    
    Returns:
    - Column analysis results including statistics and data quality metrics
    """
    return await analysis_service.analyze_column(dataset_id, column_name, analysis_type)

@router.get("/columns/{dataset_id}")
async def get_columns(
    dataset_id: str,
    analysis_service: AnalysisService = Depends()
) -> Dict[str, Any]:
    """
    Get column names and their information
    """
    try:
        return await analysis_service.get_column_names(dataset_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving columns: {str(e)}"
        )

@router.get("/describe/{dataset_id}")
async def describe_dataset(dataset_id: str) -> Dict[str, Any]:
    """
    Get descriptive statistics and missing value analysis for the dataset
    """
    return await analysis_service.get_dataset_description(dataset_id)

@router.get("/quality/{dataset_id}")
async def analyze_data_quality(
    dataset_id: str,
    analysis_service: AnalysisService = Depends()
) -> Dict[str, Any]:
    """
    Analyze data quality issues in the dataset
    
    Parameters:
    - dataset_id: ID of the dataset to analyze
    
    Returns:
    - Detailed analysis of data quality issues including:
        - Unique values count
        - Duplicate values count
        - Missing values count
        - Null values count
        - Inconsistent data types
    """
    try:
        return await analysis_service.analyze_data_quality(dataset_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing data quality: {str(e)}"
        )
