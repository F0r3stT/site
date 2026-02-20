import os
import shutil
import hashlib
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile


async def save_upload_file(
    file: UploadFile, 
    destination: Path
) -> Tuple[str, int, str]:
    """Save uploaded file and return (filename, size, sha256)"""
    # Create directory if not exists
    destination.parent.mkdir(parents=True, exist_ok=True)
    
    # Read content
    content = await file.read()
    
    # Calculate SHA256
    sha256 = hashlib.sha256(content).hexdigest()
    
    # Save file
    with open(destination, "wb") as f:
        f.write(content)
    
    return file.filename, len(content), sha256


def delete_file(file_path: Path) -> bool:
    """Delete file if exists"""
    try:
        if file_path.exists():
            file_path.unlink()
            return True
    except Exception:
        pass
    return False


def delete_directory(dir_path: Path) -> bool:
    """Delete directory recursively"""
    try:
        if dir_path.exists():
            shutil.rmtree(dir_path)
            return True
    except Exception:
        pass
    return False