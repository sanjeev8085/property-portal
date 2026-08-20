"""
Cloudinary and local hybrid storage service for property listing media.
Handles direct upload, Base64 conversion, and CDN URL generation.
"""
import os
import base64
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("storage_service")


async def upload_image_file(file_bytes: bytes, filename: str, folder: str = "properties") -> str:
    """
    Upload image to Cloudinary if credentials are configured;
    otherwise return encoded Data URI or local storage path.
    """
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if cloudinary_url or (os.getenv("CLOUDINARY_CLOUD_NAME") and os.getenv("CLOUDINARY_API_KEY")):
        try:
            import cloudinary
            import cloudinary.uploader

            response = cloudinary.uploader.upload(
                file_bytes,
                folder=folder,
                public_id=filename.split(".")[0],
                resource_type="image",
                transformation=[
                    {"width": 1280, "height": 720, "crop": "limit"},
                    {"quality": "auto", "fetch_format": "auto"}
                ]
            )
            return response.get("secure_url") or response.get("url")
        except Exception as exc:
            logger.warning(f"[Storage] Cloudinary upload failed ({exc}). Falling back to Data URI.")

    # High-reliability Data URI Fallback
    encoded = base64.b64encode(file_bytes).decode("utf-8")
    ext = filename.split(".")[-1].lower() if "." in filename else "jpeg"
    mime = f"image/{ext}" if ext in ["png", "webp", "jpeg", "jpg"] else "image/jpeg"
    return f"data:{mime};base64,{encoded}"
