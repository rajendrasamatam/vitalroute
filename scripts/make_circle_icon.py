from PIL import Image, ImageOps, ImageDraw
import os

def make_circle_icon(input_path, output_paths, border_ratio=0.05):
    try:
        # Open the image
        img = Image.open(input_path).convert("RGBA")
        
        # Create a square canvas based on the smaller dimension
        size = min(img.size)
        
        # Center crop to square
        left = (img.width - size) / 2
        top = (img.height - size) / 2
        right = (img.width + size) / 2
        bottom = (img.height + size) / 2
        img = img.crop((left, top, right, bottom))
        
        # Create a mask for the circle
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        
        # Apply mask
        output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        # Add border
        # Create a new blank image with same size
        bordered_output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        
        # Draw the main image onto it
        bordered_output.paste(output, (0, 0), output)
        
        # Draw a white border ring
        # We draw a new ellipse on top? No, that would cover content.
        # Or we can draw a stroke.
        
        draw_border = ImageDraw.Draw(bordered_output)
        border_width = int(size * border_ratio)
        
        # Draw the border stroke
        # Note: PIL's ellipse outline is drawn inside the bounding box mostly, but stroke width alignment can be tricky.
        # A simpler way for a "clean" border is to Resize the image down slightly and paste it on a white "circle" background.
        
        # METHOD 2: Composition
        # 1. Create a white circle base
        base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_base = ImageDraw.Draw(base)
        draw_base.ellipse((0, 0, size, size), fill="white")
        
        # 2. Resize original circular image to be smaller
        inner_size = size - (2 * border_width)
        inner_img = output.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        
        # 3. Paste inner image onto base (centered)
        offset = border_width
        base.paste(inner_img, (offset, offset), inner_img)
        
        final_image = base
        
        # Save to all outputs
        for path in output_paths:
            # Resize if needed for specific PWA sizes, or just save provided size?
            # The tool call implied we just overwrite existing files which might be big.
            # Let's check filename for size hint, or just save original resolution (browser handles resizing usually fine for favicon, but PWA needs specifics)
            
            # Simple logic: if filename contains size (e.g. 192x192), resize to that.
            save_img = final_image
            filename = os.path.basename(path)
            
            if "192x192" in filename:
                save_img = final_image.resize((192, 192), Image.Resampling.LANCZOS)
            elif "512x512" in filename:
                save_img = final_image.resize((512, 512), Image.Resampling.LANCZOS)
            else:
                # Keep original high res for default icon.png, or maybe limit to 512?
                # Let's keep it max 512 for main icon to avoid huge files
                if final_image.width > 512:
                    save_img = final_image.resize((512, 512), Image.Resampling.LANCZOS)
            
            save_img.save(path, format="PNG")
            print(f"Saved {path}")
            
    except Exception as e:
        print(f"Error processing image: {e}")
        exit(1)

if __name__ == "__main__":
    # Assuming the script is run from project root or checks paths relative to project root
    # Adjust paths as needed based on where we run it.
    # User uploaded image is in public/icon.png (we copied it there, but that's the destination too).
    # Wait, we overwrote public/icon.png with the raw rect image. We should use that as input?
    # Or better, use the original uploaded artifact if possible?
    # The artifact path is constant: "C:/Users/JITENDRA/.gemini/antigravity/brain/698eccf7-f012-41f1-9321-e4d23f525c2a/uploaded_image_1768103286415.png"
    # But for portability let's use the one we copied to public/icon.png as input, but it will be immediately overwritten.
    # Safe bet: Read from public/icon.png (the square/rect one), process, and write back.
    
    input_path = "e:/vital-route/public/icon.png"
    
    # Check if input exists, if not try the temp copy we made, or fail
    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        exit(1)
        
    outputs = [
        "e:/vital-route/public/icon.png",
        "e:/vital-route/public/pwa-192x192.png",
        "e:/vital-route/public/pwa-512x512.png"
    ]
    
    make_circle_icon(input_path, outputs)
