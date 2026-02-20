import zipfile
import re
from typing import Tuple, Optional


def parse_gerber_archive(file_path: str) -> Tuple[Optional[float], Optional[float], Optional[int]]:
    """
    Parse Gerber archive to extract board dimensions and layer count
    Returns: (width_mm, height_mm, layer_count)
    """
    width = None
    height = None
    layers = 0
    
    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            for filename in zf.namelist():
                # Count layers by file extensions
                if filename.lower().endswith(('.gbl', '.gbs', '.gtl', '.gts', '.gto', '.gbo')):
                    layers += 1
                
                # Try to extract dimensions from file content
                if filename.lower().endswith(('.gbr', '.ger')):
                    with zf.open(filename) as f:
                        content = f.read().decode('utf-8', errors='ignore')
                        
                        # Look for dimension commands
                        x_coords = re.findall(r'X(\d+)', content)
                        y_coords = re.findall(r'Y(\d+)', content)
                        
                        if x_coords and y_coords:
                            # Convert from Gerber units (usually 1/10000 inch)
                            max_x = max([int(x) for x in x_coords]) / 10000 * 25.4  # to mm
                            max_y = max([int(y) for y in y_coords]) / 10000 * 25.4
                            
                            if width is None or max_x > width:
                                width = max_x
                            if height is None or max_y > height:
                                height = max_y
    except Exception as e:
        logging.error(f"Error parsing Gerber: {e}")
    
    return width, height, layers