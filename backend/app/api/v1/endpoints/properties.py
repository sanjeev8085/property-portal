"""Properties CRUD endpoint."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from app.core.database import get_db
from typing import Optional
from app.api.deps import get_current_active_user, get_optional_user, require_role
from app.models.user import User, UserType, UserStatus
from app.models.property import Property, PropertyStatus, PropertyPurpose, PropertyImage

from app.schemas.property import PropertyCreate

router = APIRouter()


@router.get("/deactivated")
async def get_deactivated_properties(db: AsyncSession = Depends(get_db)):
    """Return all deactivated property IDs for cross-device & cross-browser synchronization."""
    from app.models.property import DeactivatedProperty
    sample_deact = [
        "premium-pg-coliving-space-triple-dormitory-sharing-in-gandhi-nagar-bhopal-gandhi-nagar-gandhi-nagar-bhopal-1788182184833",
        "1500-sqft-commercial-office-space-in-arera-colony-bhopal",
        "3-bhk-luxury-apartment-in-mp-nagar-bhopal",
        "1500-sqft-east-facing-plot-land-in-kolar-road-bhopal",
    ]
    try:
        res = await db.execute(select(DeactivatedProperty.id))
        db_ids = res.scalars().all()
        return list(set(sample_deact + list(db_ids)))
    except Exception:
        return sample_deact


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    """Create a new property listing with atomic database transaction & persistence verification."""
    from app.models.location import Location
    from app.models.property import PropertyCategory, PropertyAmenity

    # 1. Require Authentication (HTTP 401 Unauthorized if unauthenticated)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to create a property listing."
        )

    # 2. Require Active Account
    if current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is suspended or blocked."
        )

    # 3. Role Restriction — Only Owner, Agent, or Admin
    if current_user.user_type not in (UserType.OWNER, UserType.AGENT, UserType.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner or agent accounts can create property listings. Please upgrade your role in Profile settings."
        )

    owner_id = current_user.id

    # 4. Safe Purpose Enum mapping
    p_str = str(payload.purpose).lower()
    if "rent" in p_str or "pg" in p_str:
        p_purpose = PropertyPurpose.RENT
    else:
        p_purpose = PropertyPurpose.SELL

    # 5. Deduplicate rapid multi-taps & identical listings (HTTP 409 Conflict)
    target_phone = payload.contact_phone or current_user.mobile or ""
    dup_check = await db.execute(
        select(Property).where(
            Property.owner_id == owner_id,
            Property.title == payload.title,
            Property.price == payload.price,
        )
    )
    existing_prop = dup_check.scalars().first()
    if existing_prop:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate listing detected. A property with matching title and price already exists in your account."
        )

    prop_status = PropertyStatus.PUBLISHED if current_user.user_type == UserType.ADMIN else PropertyStatus.PENDING_APPROVAL

    # 6. Single Atomic Database Transaction
    try:
        # Find or create Location
        location_id = None
        if payload.city or payload.locality or payload.area:
            loc_city = payload.city or "Bhopal"
            loc_locality = payload.locality or payload.area or "Arera Colony"
            loc_res = await db.execute(
                select(Location).where(
                    Location.city.ilike(f"%{loc_city}%"),
                    Location.locality.ilike(f"%{loc_locality}%")
                )
            )
            loc_obj = loc_res.scalar_one_or_none()
            if not loc_obj:
                loc_obj = Location(
                    city=loc_city,
                    area=loc_locality,
                    locality=loc_locality,
                    full_address=f"{loc_locality}, {loc_city}",
                )
                db.add(loc_obj)
                await db.flush()
            location_id = loc_obj.id

        # Instantiate Property
        prop = Property(
            owner_id=owner_id,
            location_id=location_id,
            title=payload.title,
            purpose=p_purpose,
            category=payload.category or PropertyCategory.RESIDENTIAL,
            property_type=payload.property_type,
            price=payload.price,
            bhk=payload.bhk,
            area_sqft=payload.area_sqft,
            bathrooms=payload.bathrooms,
            description=payload.description,
            contact_name=payload.contact_name or current_user.name or "Property Owner",
            contact_phone=target_phone,
            contact_whatsapp=payload.contact_whatsapp or target_phone,
            status=prop_status,
        )
        db.add(prop)
        await db.flush()

        # Add Amenities in same transaction
        if payload.amenities:
            for amenity_name in payload.amenities:
                if amenity_name:
                    db.add(PropertyAmenity(
                        property_id=prop.id,
                        amenity=amenity_name
                    ))

        # Add Images in same transaction
        if payload.images and len(payload.images) > 0:
            for idx, img_url in enumerate(payload.images):
                if img_url:
                    db.add(PropertyImage(
                        property_id=prop.id,
                        image_url=img_url,
                        is_cover=(idx == 0),
                        sort_order=idx
                    ))
        elif payload.image:
            db.add(PropertyImage(
                property_id=prop.id,
                image_url=payload.image,
                is_cover=True,
                sort_order=0
            ))

        # Single atomic transaction commit
        await db.commit()
        await db.refresh(prop)

    except Exception as err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to post property right now. Database transaction failed."
        )

    # 7. Post-Commit Database Verification
    verify_res = await db.execute(select(Property).where(Property.id == prop.id))
    verified_prop = verify_res.scalar_one_or_none()
    if not verified_prop:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database persistence verification failed. Property record was not found after commit."
        )

    status_str = verified_prop.status.value if hasattr(verified_prop.status, "value") else str(verified_prop.status)
    return {
        "success": True,
        "property_id": str(verified_prop.id),
        "id": str(verified_prop.id),
        "title": verified_prop.title,
        "status": status_str,
        "message": "Property submitted successfully and is pending admin approval." if status_str == "pending_approval" else "Property created successfully."
    }

@router.get("/me/dashboard-stats")
async def get_my_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Fetch seller dashboard statistics and lead unlocks."""
    from sqlalchemy import func
    from app.models.monetization import ContactUnlock
    from app.models.user import User as DBUser

    # 1. Active Listings
    active_count_res = await db.execute(
        select(func.count(Property.id))
        .where(Property.owner_id == current_user.id, Property.status == PropertyStatus.PUBLISHED)
    )
    active_count = active_count_res.scalar() or 0

    # 2. Total properties
    total_count_res = await db.execute(
        select(func.count(Property.id))
        .where(Property.owner_id == current_user.id)
    )
    total_count = total_count_res.scalar() or 0

    # 3. Total Views
    total_views_res = await db.execute(
        select(func.sum(Property.views_count))
        .where(Property.owner_id == current_user.id)
    )
    total_views = total_views_res.scalar() or 0

    # 4. Contact Unlocks (Leads count)
    total_unlocks_res = await db.execute(
        select(func.sum(Property.contacts_count))
        .where(Property.owner_id == current_user.id)
    )
    total_unlocks = total_unlocks_res.scalar() or 0

    actual_unlocks_res = await db.execute(
        select(func.count(ContactUnlock.id))
        .where(ContactUnlock.owner_id == current_user.id)
    )
    actual_unlocks = actual_unlocks_res.scalar() or 0
    leads_count = max(total_unlocks, actual_unlocks)

    # 5. Conversion Rate
    conv_rate = 0.0
    if total_views > 0:
        conv_rate = round((leads_count / total_views) * 100, 1)

    # 6. Fetch recent leads (buyers who unlocked)
    leads_query = (
        select(ContactUnlock, Property.title, DBUser.name, DBUser.email)
        .join(Property, Property.id == ContactUnlock.property_id)
        .join(DBUser, DBUser.id == ContactUnlock.user_id)
        .where(ContactUnlock.owner_id == current_user.id)
        .order_by(ContactUnlock.unlocked_at.desc())
        .limit(10)
    )
    leads_result = await db.execute(leads_query)
    raw_leads = leads_result.all()

    recent_leads = []
    for row in raw_leads:
        unlock_rec, prop_title, buyer_name, buyer_email = row
        recent_leads.append({
            "buyer_name": buyer_name,
            "buyer_email": buyer_email,
            "property_title": prop_title,
            "unlocked_at": unlock_rec.unlocked_at.isoformat() if unlock_rec.unlocked_at else None,
            "credit_used": unlock_rec.credit_used,
        })

    return {
        "stats": {
            "active_listings": active_count,
            "total_listings": total_count,
            "total_views": total_views,
            "contact_unlocks": leads_count,
            "conversion_rate": f"{conv_rate}%",
        },
        "recent_leads": recent_leads
    }


@router.get("/me/listings")
async def get_my_properties(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all properties listed by current logged-in user across all devices."""
    result = await db.execute(
        select(Property).where(Property.owner_id == current_user.id).order_by(Property.created_at.desc())
    )
    properties = result.scalars().all()
    out = []
    for prop in properties:
        img_res = await db.execute(
            select(PropertyImage.image_url).where(PropertyImage.property_id == prop.id).order_by(PropertyImage.sort_order).limit(1)
        )
        img_url = img_res.scalar_one_or_none() or "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"
        
        price_display = f"₹{int(prop.price):,} / Mo" if prop.purpose.value == "rent" or str(prop.purpose) == "rent" else (
            f"₹{(prop.price / 10000000):.2f} Cr" if prop.price >= 10000000 else f"₹{(prop.price / 100000):.0f} Lakh"
        )
        
        out.append({
            "id": str(prop.id),
            "title": prop.title,
            "purpose": prop.purpose,
            "property_type": prop.property_type,
            "price": price_display,
            "priceNum": prop.price,
            "bhk": prop.bhk,
            "area_sqft": prop.area_sqft,
            "location": prop.locality or prop.city or "Bhopal",
            "image": img_url,
            "status": prop.status,
            "views": prop.views_count or 1,
            "leads": prop.contacts_count or 0,
        })
    return out


@router.get("/{property_id}")
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get property details with server-side contact masking and slug/UUID fallback."""
    prop = None
    pid = None

    try:
        pid = uuid.UUID(property_id)
        result = await db.execute(select(Property).where(Property.id == pid))
        prop = result.scalar_one_or_none()
    except ValueError:
        pid = None

    if not prop:
        # Search by slug or title if non-uuid identifier is passed (e.g. from SEO slugs or client timestamps)
        clean_slug = property_id.replace("-", " ").strip()
        result = await db.execute(
            select(Property).where(
                or_(
                    Property.title.ilike(f"%{property_id}%"),
                    Property.title.ilike(f"%{clean_slug}%"),
                    Property.description.ilike(f"%{clean_slug}%")
                )
            ).limit(1)
        )
        prop = result.scalar_one_or_none()
        if prop:
            pid = prop.id

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Retrieve images
    images_res = await db.execute(select(PropertyImage).where(PropertyImage.property_id == pid).order_by(PropertyImage.sort_order))
    images_list = images_res.scalars().all()
    image_urls = [img.image_url for img in images_list]
    cover_image = image_urls[0] if image_urls else "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=675&q=80"

    # Server-side Contact Masking & Gating
    is_owner = False
    is_unlocked = False

    if current_user:
        if str(prop.owner_id) == str(current_user.id) or current_user.user_type == UserType.ADMIN:
            is_owner = True
            is_unlocked = True
        else:
            from app.models.monetization import ContactUnlock
            unlock_check = await db.execute(
                select(ContactUnlock).where(
                    ContactUnlock.user_id == current_user.id,
                    ContactUnlock.property_id == pid
                )
            )
            if unlock_check.scalar_one_or_none():
                is_unlocked = True

    raw_phone = prop.contact_phone or ""
    if is_unlocked:
        exposed_phone = raw_phone
        exposed_whatsapp = prop.contact_whatsapp or raw_phone
        exposed_email = prop.contact_email or ""
    else:
        # Server-side mask: +91 98930 XXXXX
        clean_num = ''.join(c for c in raw_phone if c.isdigit())
        if len(clean_num) >= 10:
            prefix = clean_num[-10:-5]
            exposed_phone = f"+91 {prefix} XXXXX"
        else:
            exposed_phone = "+91 98930 XXXXX"
        exposed_whatsapp = ""
        exposed_email = ""

    # Retrieve amenities
    from app.models.property import PropertyAmenity
    amenities_res = await db.execute(select(PropertyAmenity.amenity).where(PropertyAmenity.property_id == pid))
    amenities_list = list(amenities_res.scalars().all())

    return {
        "id": str(prop.id),
        "amenities": amenities_list,
        "title": prop.title,
        "purpose": prop.purpose,
        "property_type": prop.property_type,
        "price": prop.price,
        "status": prop.status,
        "bhk": prop.bhk,
        "area_sqft": prop.area_sqft,
        "bathrooms": prop.bathrooms,
        "description": prop.description,
        "image": cover_image,
        "images": image_urls,
        "is_unlocked": is_unlocked,
        "is_owner": is_owner,
        "contact_phone": exposed_phone if is_unlocked else None,
        "contact_whatsapp": exposed_whatsapp if is_unlocked else None,
        "owner": {
            "name": prop.contact_name or "Verified Owner",
            "mobile": exposed_phone,
            "email": exposed_email,
            "is_unlocked": is_unlocked,
            "is_owner": is_owner
        }
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
    if str(prop.owner_id) != str(current_user.id) and current_user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this property listing.")

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

    # 4. Inspect magic byte signatures (prevent executable/SVG-XSS payloads)
    is_valid_magic = False
    if contents.startswith(b"\xff\xd8\xff"):  # JPEG
        is_valid_magic = True
    elif contents.startswith(b"\x89PNG\r\n\x1a\n"):  # PNG
        is_valid_magic = True
    elif contents.startswith(b"RIFF") and b"WEBP" in contents[:16]:  # WebP
        is_valid_magic = True

    if not is_valid_magic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupt or invalid image format. Magic byte signature verification failed."
        )

    from app.services.storage_service import upload_image_file
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    image_url = await upload_image_file(contents, filename=filename, folder="properties")

    prop_image = PropertyImage(
        property_id=pid,
        image_url=image_url,
        thumbnail_url=image_url,
        is_cover=False,
    )
    db.add(prop_image)
    await db.commit()

    return {"message": "Image uploaded successfully.", "image_id": str(prop_image.id), "url": image_url}


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



