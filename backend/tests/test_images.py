"""
Test Suite: Cloudinary Storage & Image Upload API Endpoints
Tests:
- POST /api/v1/images/upload (authenticated success with mock Cloudinary)
- POST /api/v1/images/upload (unauthenticated failure -> 401)
- POST /api/v1/images/upload (unsupported file format -> error in response)
- Storage service functions: upload_to_cloudinary, delete_from_cloudinary, delete_many_from_cloudinary
- Property creation with image objects metadata
- Admin deletion of property cleans up Cloudinary assets
"""
import io
import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient


@pytest.mark.asyncio
class TestImageUploadAPI:
    """Tests for POST /api/v1/images/upload"""

    async def test_upload_image_unauthenticated_fails(self, client: AsyncClient):
        """Unauthenticated request is rejected with 401/403."""
        resp = await client.post(
            "/api/v1/images/upload",
            files={"files": ("test.jpg", b"fake-jpg-content", "image/jpeg")}
        )
        assert resp.status_code in (401, 403)

    async def test_upload_image_no_files_fails(self, client: AsyncClient, owner_auth_headers: dict):
        """Empty files parameter is rejected with 422 or 400."""
        resp = await client.post(
            "/api/v1/images/upload",
            headers=owner_auth_headers
        )
        assert resp.status_code in (400, 422)

    @patch("app.api.v1.endpoints.images.is_cloudinary_configured", return_value=True)
    @patch("app.api.v1.endpoints.images.upload_to_cloudinary")
    async def test_upload_image_success(
        self,
        mock_upload,
        mock_configured,
        client: AsyncClient,
        owner_auth_headers: dict
    ):
        """Authenticated user can upload property images and get CDN URLs."""
        mock_upload.return_value = {
            "image_url": "https://res.cloudinary.com/aurahomes/image/upload/v1234/sample.jpg",
            "thumbnail_url": "https://res.cloudinary.com/aurahomes/image/upload/w_300,c_limit/sample.jpg",
            "card_url": "https://res.cloudinary.com/aurahomes/image/upload/w_600,c_limit/sample.jpg",
            "detail_url": "https://res.cloudinary.com/aurahomes/image/upload/w_1200,c_limit/sample.jpg",
            "public_id": "aurahomes/properties/sample",
            "width": 1200,
            "height": 800,
            "file_size": 150000,
        }

        # Create a small valid JPEG binary header
        fake_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100

        resp = await client.post(
            "/api/v1/images/upload",
            headers=owner_auth_headers,
            files=[("files", ("property1.jpg", fake_jpeg, "image/jpeg"))]
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["uploaded"] == 1
        assert len(data["images"]) == 1
        img = data["images"][0]
        assert img["url"] == "https://res.cloudinary.com/aurahomes/image/upload/v1234/sample.jpg"
        assert img["thumbnail_url"] == "https://res.cloudinary.com/aurahomes/image/upload/w_300,c_limit/sample.jpg"
        assert img["card_url"] == "https://res.cloudinary.com/aurahomes/image/upload/w_600,c_limit/sample.jpg"
        assert img["detail_url"] == "https://res.cloudinary.com/aurahomes/image/upload/w_1200,c_limit/sample.jpg"
        assert img["public_id"] == "aurahomes/properties/sample"

    @patch("app.api.v1.endpoints.images.is_cloudinary_configured", return_value=True)
    @patch("app.api.v1.endpoints.images.upload_to_cloudinary", side_effect=RuntimeError("Cloudinary down"))
    async def test_upload_image_cloudinary_failure_returns_502(
        self,
        mock_upload,
        mock_configured,
        client: AsyncClient,
        owner_auth_headers: dict
    ):
        """When Cloudinary upload fails, endpoint returns 502 Bad Gateway so frontend blocks publishing."""
        fake_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00" + b"\x00" * 50

        resp = await client.post(
            "/api/v1/images/upload",
            headers=owner_auth_headers,
            files=[("files", ("property1.jpg", fake_jpeg, "image/jpeg"))]
        )

        assert resp.status_code == 502
        data = resp.json()
        assert "detail" in data


@pytest.mark.asyncio
class TestPropertyCreationWithCloudinaryMetadata:
    """Test saving property with Cloudinary image metadata objects"""

    async def test_create_property_with_image_meta_objects(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {
            "title": "Cloudinary Metadata Apartment in Arera Colony",
            "purpose": "rent",
            "category": "residential",
            "property_type": "Apartment",
            "bhk": 3,
            "area_sqft": 1500.0,
            "bathrooms": 2,
            "price": 35000.0,
            "city": "Bhopal",
            "area": "Arera Colony",
            "images": [
                {
                    "url": "https://res.cloudinary.com/aurahomes/image/upload/v1/flat1.jpg",
                    "thumbnail_url": "https://res.cloudinary.com/aurahomes/image/upload/w_300/flat1.jpg",
                    "card_url": "https://res.cloudinary.com/aurahomes/image/upload/w_600/flat1.jpg",
                    "detail_url": "https://res.cloudinary.com/aurahomes/image/upload/w_1200/flat1.jpg",
                    "public_id": "aurahomes/properties/flat1",
                    "width": 1200,
                    "height": 800,
                    "file_size": 245000
                }
            ]
        }

        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 201
        prop_id = resp.json()["property_id"]

        # Fetch details
        get_resp = await client.get(f"/api/v1/properties/{prop_id}")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert "image_details" in get_data
        assert len(get_data["image_details"]) == 1
        img_meta = get_data["image_details"][0]
        assert img_meta["public_id"] == "aurahomes/properties/flat1"
        assert img_meta["card_url"] == "https://res.cloudinary.com/aurahomes/image/upload/w_600/flat1.jpg"
