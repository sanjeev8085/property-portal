"""
One-time database migration script to scan PropertyImage records containing
Base64 Data URIs, upload them to Cloudinary CDN, and update image_url with secure HTTPS links.
"""
import asyncio
import base64
import os
import sys
from sqlalchemy import select

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import async_session_factory
from app.models.property import PropertyImage
from app.services.storage_service import upload_image_file


async def run_migration():
    print("Starting Cloudinary Image Migration...")
    async with async_session_factory() as session:
        result = await session.execute(select(PropertyImage))
        images = result.scalars().all()

        migrated_count = 0
        for img in images:
            if img.image_url and img.image_url.startswith("data:image"):
                try:
                    # Parse base64
                    header, data = img.image_url.split(",", 1)
                    raw_bytes = base64.b64decode(data)
                    filename = f"migrated_{img.id}.jpg"

                    cdn_url = await upload_image_file(raw_bytes, filename=filename)
                    if cdn_url and not cdn_url.startswith("data:"):
                        img.image_url = cdn_url
                        session.add(img)
                        migrated_count += 1
                except Exception as exc:
                    print(f"Failed to migrate image {img.id}: {exc}")

        if migrated_count > 0:
            await session.commit()
            print(f"Successfully migrated {migrated_count} Base64 images to Cloudinary CDN.")
        else:
            print("No Base64 images found or Cloudinary credentials not configured.")


if __name__ == "__main__":
    asyncio.run(run_migration())
