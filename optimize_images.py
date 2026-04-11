import os
from PIL import Image

def optimize_image(input_path, output_path, max_width=300):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return
        
    try:
        with Image.open(input_path) as img:
            # We preserve RGBA transparency
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Simple scaling proportion if needed, but the original ones are already small or fine. We'll simply save as webp.
            width, height = img.size
            if width > max_width:
                new_h = int((max_width / width) * height)
                img = img.resize((max_width, new_h), Image.Resampling.LANCZOS)
                
            img.save(output_path, "webp", quality=85, method=6)
            print(f"Optimized: {output_path}")
    except Exception as e:
        print(f"Failed optimizing {input_path}: {e}")

if __name__ == "__main__":
    base_dir = "images/logos_ticker"
    files_to_optimize = {
        "Salvaxe-1500px.png": "Salvaxe.webp",
        "PP_Logo-NEGRO-1000px.png": "PP_Logo-NEGRO.webp",
        "PF-Logo_NEGRO-1000px.png": "PF-Logo_NEGRO.webp"
    }
    
    for in_file, out_file in files_to_optimize.items():
        in_path = os.path.join(base_dir, in_file)
        out_path = os.path.join(base_dir, out_file)
        optimize_image(in_path, out_path)
