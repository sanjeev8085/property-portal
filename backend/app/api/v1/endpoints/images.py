"""
Image Upload Endpoint — POST /api/v1/images/upload

Accepts multipart/form-data image files, uploads each to Cloudinary,
and returns CDN URLs with optimization metadata.

Security:
- Requires authenticated user (Bearer token)
- File type validated (images only)
- File size limit enforced before upload
- Cloudinary API secret never sent to frontend
"""
import io
import logging
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.storage_service import (
    upload_to_cloudinary,
    is_cloudinary_configured,
    MAX_FILE_SIZE_BYTES,
)

logger = logging.getLogger("images_endpoint")
router = APIRouter()

# ─── Allowed MIME types ────────────────────────────────────────────────────────
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

MAX_FILES_PER_REQUEST = 10


@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_property_images(
    files: List[UploadFile] = File(..., description="Image files to upload (max 10)"),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload one or more property images to Cloudinary.

    Returns a list of uploaded image metadata including CDN URLs for
    thumbnail (300px), card (600px), and detail (1200px) sizes.

    Property MUST NOT be published until this endpoint returns success.
    """
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image file is required.",
        )

    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES_PER_REQUEST} files allowed per upload request.",
        )

    if not is_cloudinary_configured():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Image storage is not configured on this server. "
                "Contact the administrator to set CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
            ),
        )

    results = []
    upload_errors = []

    for file in files:
        # ── Validate content type ──────────────────────────────────────────────
        content_type = (file.content_type or "").lower()
        if content_type not in ALLOWED_CONTENT_TYPES:
            upload_errors.append({
                "filename": file.filename,
                "error": f"Unsupported file type: {content_type}. Allowed: JPG, PNG, WebP.",
            })
            continue

        # ── Read file bytes ────────────────────────────────────────────────────
        try:
            file_bytes = await file.read()
        except Exception as exc:
            upload_errors.append({
                "filename": file.filename,
                "error": f"Failed to read file: {exc}",
            })
            continue

        file_size = len(file_bytes)

        # ── Validate file size ─────────────────────────────────────────────────
        if file_size == 0:
            upload_errors.append({
                "filename": file.filename,
                "error": "Empty file received.",
            })
            continue

        if file_size > MAX_FILE_SIZE_BYTES:
            upload_errors.append({
                "filename": file.filename,
                "error": (
                    f"File too large ({file_size / 1024 / 1024:.1f} MB). "
                    f"Maximum {MAX_FILE_SIZE_BYTES // 1024 // 1024} MB allowed."
                ),
            })
            continue

        # ── Upload to Cloudinary ───────────────────────────────────────────────
        try:
            upload_result = await upload_to_cloudinary(
                file_bytes=file_bytes,
                filename=file.filename or f"upload_{len(results)}",
                folder="aurahomes/properties",
                file_size=file_size,
            )
            results.append({
                "filename": file.filename,
                "url": upload_result["image_url"],
                "thumbnail_url": upload_result["thumbnail_url"],
                "card_url": upload_result["card_url"],
                "detail_url": upload_result["detail_url"],
                "public_id": upload_result["public_id"],
                "width": upload_result["width"],
                "height": upload_result["height"],
                "file_size": upload_result["file_size"],
            })
        except ValueError as ve:
            # Known validation error (e.g. file too large)
            upload_errors.append({
                "filename": file.filename,
                "error": str(ve),
            })
        except RuntimeError as re:
            # Cloudinary upload failed
            logger.error(f"[Images] Cloudinary upload failed for {file.filename!r}: {re}")
            upload_errors.append({
                "filename": file.filename,
                "error": "Upload to CDN failed. Please try again.",
            })
        except Exception as exc:
            logger.error(f"[Images] Unexpected upload error for {file.filename!r}: {exc}")
            upload_errors.append({
                "filename": file.filename,
                "error": "Unexpected upload error. Please try again.",
            })

    # ── Respond ────────────────────────────────────────────────────────────────
    # If ALL uploads failed, return 502 so the frontend blocks property creation
    if len(results) == 0 and len(upload_errors) > 0:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": "All image uploads failed. Property cannot be published.",
                "errors": upload_errors,
            },
        )

    return {
        "uploaded": len(results),
        "failed": len(upload_errors),
        "images": results,
        "errors": upload_errors,
    }
