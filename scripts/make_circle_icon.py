from PIL import Image, ImageOps, ImageDraw
import os

def make_circle_icon(input_path, output_paths):
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
        
        # No border logic anymore, final_image is just the masked output
        final_image = output
        
        # Save to all outputs
        for path in output_paths:
            save_img = final_image
            filename = os.path.basename(path)
            
            if "192x192" in filename:
                save_img = final_image.resize((192, 192), Image.Resampling.LANCZOS)
            elif "512x512" in filename:
                save_img = final_image.resize((512, 512), Image.Resampling.LANCZOS)
            else:
                 # Keep it max 512 for main icon to avoid huge files
                if final_image.width > 512:
                    save_img = final_image.resize((512, 512), Image.Resampling.LANCZOS)
            
            save_img.save(path, format="PNG")
            print(f"Saved {path}")
            
    except Exception as e:
        print(f"Error processing image: {e}")
        exit(1)

if __name__ == "__main__":
    input_path = "e:/vital-route/public/icon.png"
    
    # Check if input exists
    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        exit(1)
        
    outputs = [
        "e:/vital-route/public/icon.png",
        "e:/vital-route/public/pwa-192x192.png",
        "e:/vital-route/public/pwa-512x512.png"
    ]
    
    make_circle_icon(input_path, outputs)
