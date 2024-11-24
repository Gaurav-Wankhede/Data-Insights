import pandas as pd
from fastapi import UploadFile
from pathlib import Path
from typing import Union, Dict
import aiofiles
import uuid
import os
import atexit
from datetime import datetime, timedelta
import asyncio
import shutil

# Store file metadata for cleanup
temp_files: Dict[str, datetime] = {}

async def save_uploaded_file(file: UploadFile, upload_dir: Path) -> Path:
    """
    Saves an uploaded file to the specified directory with a unique filename
    Returns the path to the saved file
    """
    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    original_extension = Path(file.filename).suffix
    new_filename = f"{timestamp}_{unique_id}{original_extension}"
    
    # Create full file path
    file_path = upload_dir / new_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Store file metadata for cleanup
    temp_files[str(file_path)] = datetime.now()
    
    return file_path

async def cleanup_old_files(max_age_minutes: int = 30):
    """
    Removes files older than max_age_minutes
    """
    current_time = datetime.now()
    files_to_remove = []
    
    for file_path, creation_time in temp_files.items():
        if current_time - creation_time > timedelta(minutes=max_age_minutes):
            try:
                os.remove(file_path)
                files_to_remove.append(file_path)
            except OSError:
                pass
    
    # Remove cleaned up files from metadata
    for file_path in files_to_remove:
        temp_files.pop(file_path, None)

async def start_cleanup_task():
    """
    Starts the periodic cleanup task
    """
    while True:
        await cleanup_old_files()
        await asyncio.sleep(300)  # Run every 5 minutes

def cleanup_on_shutdown():
    """
    Cleanup all temporary files on application shutdown
    """
    upload_dir = Path("data/uploads")
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

# Register cleanup on shutdown
atexit.register(cleanup_on_shutdown)

async def read_file_content(file_path: Union[str, Path], file_extension: str) -> pd.DataFrame:
    """
    Reads content from a file based on its extension
    Returns a pandas DataFrame
    """
    file_path = Path(file_path)
    
    if file_extension.lower() == '.csv':
        return pd.read_csv(file_path)
    elif file_extension.lower() in ['.xlsx', '.xls']:
        return pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")

def read_dataset(file_path: Union[str, Path]) -> pd.DataFrame:
    """
    Reads a dataset from various file formats
    """
    file_path = Path(file_path)
    
    if file_path.suffix == '.csv':
        return pd.read_csv(file_path)
    elif file_path.suffix in ['.xlsx', '.xls']:
        return pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path.suffix}")
