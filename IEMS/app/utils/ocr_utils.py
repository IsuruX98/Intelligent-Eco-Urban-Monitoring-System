import pytesseract
from PIL import Image, ImageFilter, ImageOps
import os

def extract_text_from_image(image_path):
    """
    Extract text from an image file using pytesseract OCR, with preprocessing for better accuracy.

    Args:
        image_path (str): Path to the image file.

    Returns:
        str: Extracted text from the image.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    image = Image.open(image_path)
    # Preprocessing: convert to grayscale
    image = ImageOps.grayscale(image)
    # Preprocessing: apply binarization (thresholding)
    image = image.point(lambda x: 0 if x < 150 else 255, '1')
    # Preprocessing: apply sharpening filter
    image = image.filter(ImageFilter.SHARPEN)
    text = pytesseract.image_to_string(image)
    return text 