"""Properties CRUD endpoint."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_active_user, require_role
from app.models.user import User, UserType
from app.models.property import Property, PropertyStatus

from app.schemas.property import PropertyCreate

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.OWNER, UserType.AGENT)),
):
    """Create a new property listing."""
    # Duplicate detection heuristic
    dup_query = select(Property).where(
        Property.title == payload.title,
        Property.price == payload.price,
        Property.bhk == payload.bhk
    )
    dup_result = await db.execute(dup_query)
    if dup_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate listing detected. A property with the same title, price, and configuration is already listed."
        )

    prop = Property(
        owner_id=current_user.id,
        title=payload.title,
        purpose=payload.purpose,
        category=payload.category,
        property_type=payload.property_type,
        price=payload.price,
        bhk=payload.bhk,
        area_sqft=payload.area_sqft,
        bathrooms=payload.bathrooms,
        description=payload.description,
        status=PropertyStatus.PUBLISHED,
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)

    # Trigger new property posted (admin alert)
    try:
        from app.services.notification_service import send_property_posted_admin_notification
        await send_property_posted_admin_notification(property_title=prop.title, db=db)
    except Exception:
        pass

    return {"id": str(prop.id), "title": prop.title, "status": prop.status}


@router.get("/{property_id}")
async def get_property(property_id: str, db: AsyncSession = Depends(get_db)):
    """Get property details (contact info masked for public)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID format.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {
        "id": str(prop.id),
        "title": prop.title,
        "purpose": prop.purpose,
        "price": prop.price,
        "status": prop.status,
        "bhk": prop.bhk,
        "area_sqft": prop.area_sqft,
        # Contact info intentionally masked
        "contact_phone": None,
        "contact_email": None,
    }


@router.patch("/{property_id}/status")
async def update_property_status(
    property_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update property status (owner only)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID format.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if str(prop.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized.")

    new_status = payload.get("status")
    if new_status:
        old_status = prop.status
        prop.status = new_status
        await db.commit()

        # Trigger notification if status is updated to sold or rented
        if new_status.lower() in ["sold", "rented"] and old_status != new_status:
            try:
                from app.services.notification_service import send_property_sold_rented_notification
                await send_property_sold_rented_notification(
                    property_id=prop.id,
                    property_title=prop.title,
                    new_status=new_status,
                    db=db
                )
            except Exception:
                pass

    return {"id": str(prop.id), "status": prop.status}


@router.put("/{property_id}")
async def update_property(
    property_id: str,
    payload: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.OWNER, UserType.AGENT)),
):
    """Edit property details (and notify favoriting users if price changes)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID format.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if str(prop.owner_id) != str(current_user.id) and current_user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized.")

    old_price = prop.price
    new_price = payload.price

    # Update fields
    prop.title = payload.title
    prop.purpose = payload.purpose
    prop.category = payload.category
    prop.property_type = payload.property_type
    prop.price = payload.price
    prop.bhk = payload.bhk
    prop.area_sqft = payload.area_sqft
    prop.bathrooms = payload.bathrooms
    prop.description = payload.description

    db.add(prop)
    await db.commit()

    # Trigger notification if price has changed!
    if old_price != new_price:
        try:
            from app.services.notification_service import send_price_changed_notification
            await send_price_changed_notification(
                property_id=prop.id,
                property_title=prop.title,
                old_price=old_price,
                new_price=new_price,
                db=db
            )
        except Exception:
            pass

    return {"id": str(prop.id), "title": prop.title, "status": prop.status}


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a property (owner only)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if str(prop.owner_id) != str(current_user.id) and current_user.user_type not in (UserType.AGENT,):
        raise HTTPException(status_code=403, detail="Not authorized.")

    await db.delete(prop)
    await db.commit()


from fastapi import UploadFile, File
from app.models.property import PropertyImage

@router.post("/{property_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_property_image(
    property_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload and validate an image for a property listing."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    # 1. Validate property existence and owner permissions
    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if str(prop.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to add images to this listing.")

    # 2. Validate file type (image MIME check)
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only JPEG, PNG, and WebP images are allowed."
        )

    # 3. Validate file size (5MB max size constraint)
    contents = await file.read()
    max_size = 5 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Maximum allowed size is 5MB."
        )

    # Simulated storage URL
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    mock_url = f"/uploads/{filename}"

    prop_image = PropertyImage(
        property_id=pid,
        image_url=mock_url,
        thumbnail_url=mock_url,
        is_cover=False,
    )
    db.add(prop_image)
    await db.commit()

    return {"message": "Image uploaded successfully.", "image_id": str(prop_image.id), "url": mock_url}


@router.delete("/{property_id}/images/{image_id}")
async def delete_property_image(
    property_id: str,
    image_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a property image (owner only)."""
    try:
        pid = uuid.UUID(property_id)
        img_id = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid ID formats.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if str(prop.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete images from this listing.")

    img_result = await db.execute(
        select(PropertyImage).where(PropertyImage.id == img_id, PropertyImage.property_id == pid)
    )
    img = img_result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found.")

    await db.delete(img)
    await db.commit()

    return {"message": "Image deleted successfully."}


@router.patch("/{property_id}/images/reorder")
async def reorder_property_images(
    property_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Reorder property images by updating their sort_order (owner only)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if str(prop.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to reorder images.")

    image_ids = payload.get("image_ids", [])
    if not isinstance(image_ids, list):
        raise HTTPException(status_code=400, detail="image_ids must be a list of UUID strings.")

    # Fetch all property images first
    images_result = await db.execute(select(PropertyImage).where(PropertyImage.property_id == pid))
    images_map = {str(img.id): img for img in images_result.scalars().all()}

    for index, img_id_str in enumerate(image_ids):
        if img_id_str in images_map:
            images_map[img_id_str].sort_order = index
            db.add(images_map[img_id_str])

    await db.commit()
    return {"message": "Images reordered successfully."}


from fastapi import Request
from app.models.property import PropertyView
from jose import jwt, JWTError
from app.core.config import settings

@router.post("/{property_id}/view", status_code=status.HTTP_201_CREATED)
async def track_property_view(
    property_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Log a page view for a property listing (anonymous or authenticated)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Try resolving user ID if authorization header is present
    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
        except JWTError:
            pass

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("User-Agent", "")

    view = PropertyView(
        property_id=pid,
        user_id=uuid.UUID(user_id) if user_id else None,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(view)
    await db.commit()

    return {"message": "View tracked successfully."}



