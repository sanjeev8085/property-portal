"""
Cloudinary Storage Service for AuraHomes property listing media.

Handles image upload with optimization, URL generation for multiple sizes,
and deletion (single + bulk) for cleanup when properties are removed.

Cloudinary Free Tier: 25 GB storage, 25 GB bandwidth/month.
Images served as WebP/AVIF via `fetch_format: auto` — no extra cost.
"""
import io
import logging
import os
from typing import Optional

logger = logging.getLogger("storage_service")

# ─── File size limits ──────────────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024   # 15 MB client-side guard
MAX_CLOUDINARY_BYTES = 10 * 1024 * 1024  # 10 MB Cloudinary free tier limit

# ─── Cloudinary transformation presets ────────────────────────────────────────
#   crop="limit"  → only downscale if larger (never upscale)
#   fetch_format="auto" → WebP on Chrome/Firefox, AVIF where supported
#   quality="auto:good" → ~75-80%, Cloudinary's perceptual quality algorithm

UPLOAD_TRANSFORMATION = [
    {"width": 1200, "crop": "limit"},
    {"quality": "auto:good", "fetch_format": "auto"},
]


def _get_cloudinary():
    """Lazy import + configure cloudinary from environment on first use."""
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.getenv("CLOUDINARY_API_KEY", "")
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "")

    if not cloud_name or not api_key or not api_secret:
        raise RuntimeError(
            "Cloudinary credentials not configured. "
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    return cloudinary


def _build_variant_url(public_id: str, width: int, cloud_name: str) -> str:
    """
    Build an optimized Cloudinary URL for a specific width without an API call.
    Format: https://res.cloudinary.com/<cloud>/image/upload/w_<N>,c_limit,q_auto:good,f_auto/<public_id>
    """
    return (
        f"https://res.cloudinary.com/{cloud_name}/image/upload"
        f"/w_{width},c_limit,q_auto:good,f_auto/{public_id}"
    )


def _resize_with_pillow(file_bytes: bytes, max_dimension: int = 1200) -> bytes:
    """
    Pre-process with Pillow: resize to max_dimension on longest side, convert RGBA→RGB.
    Returns JPEG bytes. Fallback is original bytes if Pillow fails.
    """
    try:
        from PIL import Image

        img = Image.open(io.BytesIO(file_bytes))
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")

        w, h = img.size
        if w > max_dimension or h > max_dimension:
            ratio = max_dimension / max(w, h)
            new_w = max(1, int(w * ratio))
            new_h = max(1, int(h * ratio))
            img = img.resize((new_w, new_h), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=92, optimize=True)
        return buf.getvalue()
    except Exception as exc:
        logger.warning(f"[Storage] Pillow pre-processing failed: {exc}. Uploading original.")
        return file_bytes


async def upload_to_cloudinary(
    file_bytes: bytes,
    filename: str,
    folder: str = "aurahomes/properties",
    file_size: Optional[int] = None,
) -> dict:
    """
    Upload image bytes to Cloudinary with optimization transformations.

    Returns a dict with:
        image_url       — Original Cloudinary secure_url (≤1200px, WebP/AVIF)
        thumbnail_url   — 300px variant
        card_url        — 600px variant
        detail_url      — 1200px variant
        public_id       — Cloudinary public_id (used for deletion)
        width           — Uploaded image width (px)
        height          — Uploaded image height (px)
        file_size       — Original file size in bytes

    Raises RuntimeError if:
        - Credentials not configured
        - File exceeds size limit
        - Cloudinary returns an error
    """
    actual_size = file_size or len(file_bytes)

    # Guard: reject before sending
    if actual_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File too large ({actual_size / 1024 / 1024:.1f} MB). "
            f"Maximum allowed is {MAX_FILE_SIZE_BYTES // 1024 // 1024} MB."
        )

    # Pre-process with Pillow: normalize format, downscale to ≤1200px
    processed_bytes = _resize_with_pillow(file_bytes, max_dimension=1200)

    # Get configured cloudinary module
    cld = _get_cloudinary()
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")

    # Derive a clean public_id from filename (strip extension)
    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    # Sanitize: keep only alphanumeric, hyphens, underscores
    stem = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem)

    try:
        response = cld.uploader.upload(
            processed_bytes,
            folder=folder,
            use_filename=False,
            unique_filename=True,
            overwrite=False,
            resource_type="image",
            transformation=UPLOAD_TRANSFORMATION,
        )
    except Exception as exc:
        logger.error(f"[Storage] Cloudinary upload error for '{filename}': {exc}")
        raise RuntimeError(f"Cloudinary upload failed: {exc}") from exc

    public_id = response.get("public_id", "")
    secure_url = response.get("secure_url") or response.get("url", "")
    img_width = response.get("width")
    img_height = response.get("height")

    if not secure_url:
        raise RuntimeError("Cloudinary returned no URL — upload may have failed silently.")

    # Build size variants from public_id (no extra API call)
    thumbnail_url = _build_variant_url(public_id, 300, cloud_name)
    card_url = _build_variant_url(public_id, 600, cloud_name)
    detail_url = _build_variant_url(public_id, 1200, cloud_name)

    logger.info(f"[Storage] Uploaded '{filename}' → public_id={public_id!r}")

    return {
        "image_url": secure_url,
        "thumbnail_url": thumbnail_url,
        "card_url": card_url,
        "detail_url": detail_url,
        "public_id": public_id,
        "width": img_width,
        "height": img_height,
        "file_size": actual_size,
    }


def delete_from_cloudinary(public_id: str) -> bool:
    """
    Delete a single asset from Cloudinary by public_id.
    Returns True on success, False on failure (best-effort — never raises).
    """
    if not public_id:
        return False
    try:
        cld = _get_cloudinary()
        result = cld.uploader.destroy(public_id, resource_type="image")
        success = result.get("result") in ("ok", "not found")
        if success:
            logger.info(f"[Storage] Deleted Cloudinary asset: {public_id!r}")
        else:
            logger.warning(f"[Storage] Cloudinary delete returned unexpected: {result}")
        return success
    except Exception as exc:
        logger.warning(f"[Storage] Cloudinary delete failed for {public_id!r}: {exc}")
        return False


def delete_many_from_cloudinary(public_ids: list[str]) -> dict:
    """
    Bulk delete assets from Cloudinary.
    Returns {deleted: [...], failed: [...]} summary.
    """
    deleted = []
    failed = []
    for pid in public_ids:
        if pid:
            if delete_from_cloudinary(pid):
                deleted.append(pid)
            else:
                failed.append(pid)
    return {"deleted": deleted, "failed": failed}


def is_cloudinary_configured() -> bool:
    """Check if Cloudinary credentials are present in the environment."""
    return bool(
        os.getenv("CLOUDINARY_CLOUD_NAME")
        and os.getenv("CLOUDINARY_API_KEY")
        and os.getenv("CLOUDINARY_API_SECRET")
    )


# ─── Legacy compatibility shim ────────────────────────────────────────────────
async def upload_image_file(file_bytes: bytes, filename: str, folder: str = "properties") -> str:
    """
    Legacy shim kept for backward compatibility.
    Prefer upload_to_cloudinary() for new code.
    Falls back to a placeholder URL if Cloudinary is not configured (dev mode).
    """
    if is_cloudinary_configured():
        try:
            result = await upload_to_cloudinary(file_bytes, filename, f"aurahomes/{folder}")
            return result["image_url"]
        except Exception as exc:
            logger.warning(f"[Storage] upload_image_file shim failed: {exc}")

    # Dev-mode fallback: return a placeholder (do NOT store base64 in DB)
    logger.warning("[Storage] Cloudinary not configured. Returning placeholder URL.")
    return "https://res.cloudinary.com/demo/image/upload/sample.jpg"
