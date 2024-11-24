from typing import List
import pandas as pd

def validate_dataset(df: pd.DataFrame) -> List[str]:
    """
    Validates a dataset for common issues
    Returns a list of validation messages
    """
    validation_messages = []
    
    # Check for empty dataset
    if df.empty:
        validation_messages.append("Dataset is empty")
        
    # Check for missing values
    missing_cols = df.columns[df.isnull().any()].tolist()
    if missing_cols:
        validation_messages.append(f"Missing values found in columns: {', '.join(missing_cols)}")
        
    return validation_messages
