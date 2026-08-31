from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, UserType
from app.models.property import Property, PropertyStatus
from app.models.monetization import Payment, ContactUnlock

router = APIRouter()


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Admin dashboard stats."""
    # Count total users
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0

    # Count properties by status
    total_prop_check = await db.execute(select(func.count(Property.id)))
    total_properties = total_prop_check.scalar() or 0

    pending_prop_check = await db.execute(
        select(func.count(Property.id)).where(Property.status == PropertyStatus.PENDING_APPROVAL)
    )
    pending_properties = pending_prop_check.scalar() or 0

    published_prop_check = await db.execute(
        select(func.count(Property.id)).where(Property.status == PropertyStatus.PUBLISHED)
    )
    published_properties = published_prop_check.scalar() or 0

    # Count unlocks
    unlock_check = await db.execute(select(func.count(ContactUnlock.id)))
    total_unlocks = unlock_check.scalar() or 0

    # Sum payments revenue
    rev_check = await db.execute(select(func.sum(Payment.amount)))
    total_revenue = rev_check.scalar() or 0.0

    return {
        "stats": {
            "total_users": total_users,
            "total_properties": total_properties,
            "pending_properties": pending_properties,
            "published_properties": published_properties,
            "total_unlocks": total_unlocks,
            "total_revenue": total_revenue,
        }
    }


@router.post("/properties/{property_id}/approve")
async def approve_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Approve a property listing (status -> published)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop.status = PropertyStatus.PUBLISHED
    prop.published_at = datetime.now(timezone.utc)
    db.add(prop)
    await db.commit()

    # Trigger property approved notification to owner
    from app.services.notification_service import send_property_approved_notification
    if prop.owner_id:
        await send_property_approved_notification(
            user_id=prop.owner_id,
            property_id=prop.id,
            property_title=prop.title,
            db=db
        )

    # Trigger alerts matching loop
    from app.models.monetization import SavedSearch
    from app.services.notification_service import send_saved_search_match_notification

    searches_result = await db.execute(select(SavedSearch).where(SavedSearch.is_active == True))
    saved_searches = searches_result.scalars().all()

    for s in saved_searches:
        filters = s.filters or {}
        match = True

        if "bhk" in filters and prop.bhk != filters["bhk"]:
            match = False
        if "price_max" in filters and prop.price > filters["price_max"]:
            match = False
        if "price_min" in filters and prop.price < filters["price_min"]:
            match = False
        if "property_type" in filters and prop.property_type.lower() != filters["property_type"].lower():
            match = False

        if match:
            await send_saved_search_match_notification(
                user_id=s.user_id,
                search_name=s.name,
                property_id=prop.id,
                property_title=prop.title,
                price=prop.price,
                db=db,
                notify_email=bool(s.notify_email),
                notify_whatsapp=bool(s.notify_whatsapp)
            )

    await db.commit()

    return {"message": "Property listing approved and published. Match alerts triggered.", "property_id": str(prop.id), "status": prop.status}


@router.post("/properties/{property_id}/reject")
async def reject_property(
    property_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Reject a property listing (status -> rejected)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    reason = payload.get("reason", "Incomplete listing details.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop.status = PropertyStatus.REJECTED
    prop.rejection_reason = reason
    db.add(prop)
    await db.commit()

    # Trigger rejection notification to owner
    try:
        from app.services.notification_service import send_property_rejected_notification
        if prop.owner_id:
            await send_property_rejected_notification(
                owner_id=prop.owner_id,
                property_title=prop.title,
                reason=reason,
                db=db
            )
    except Exception:
        pass

    return {"message": "Property listing rejected.", "property_id": str(prop.id), "status": prop.status}


@router.post("/properties/{property_id}/verify")
async def verify_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Toggle verification badge on property listing."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop.is_verified = not prop.is_verified
    db.add(prop)
    await db.commit()

    return {"message": "Verification status toggled.", "property_id": str(prop.id), "is_verified": prop.is_verified}


from app.models.user import UserStatus
from app.models.property import PropertyReport, ReportStatus

@router.get("/users")
async def list_admin_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """List all registered users (admin only)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [{
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "mobile": u.mobile,
        "city": u.city,
        "user_type": u.user_type,
        "status": u.status,
        "created_at": u.created_at,
    } for u in users]


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Update a user's status (admin only)."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user ID format.")

    status_str = payload.get("status")
    if not status_str:
        raise HTTPException(status_code=400, detail="status is required.")

    try:
        status_enum = UserStatus(status_str.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid user status: {status_str}")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.status = status_enum
    db.add(user)
    await db.commit()

    return {"message": "User status updated successfully.", "user_id": str(user.id), "status": user.status}


@router.get("/properties")
async def list_admin_properties(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """List all property listings for admin overview."""
    result = await db.execute(select(Property).order_by(Property.created_at.desc()))
    properties = result.scalars().all()
    return [{
        "id": str(p.id),
        "title": p.title,
        "purpose": p.purpose,
        "property_type": p.property_type,
        "price": p.price,
        "status": p.status,
        "is_featured": p.is_featured,
        "is_verified": p.is_verified,
        "created_at": p.created_at,
    } for p in properties]


@router.patch("/properties/{property_id}/feature")
async def toggle_featured_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Toggle a listing's featured status (admin only)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop.is_featured = not prop.is_featured
    db.add(prop)
    await db.commit()

    return {"message": "Featured status toggled.", "property_id": str(prop.id), "is_featured": prop.is_featured}


@router.get("/reports")
async def list_admin_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """List all listing abuse reports."""
    result = await db.execute(select(PropertyReport).order_by(PropertyReport.created_at.desc()))
    reports = result.scalars().all()
    return [{
        "id": str(r.id),
        "property_id": str(r.property_id),
        "reporter_id": str(r.reporter_id),
        "reason": r.reason,
        "description": r.description,
        "status": r.status,
        "created_at": r.created_at,
    } for r in reports]


@router.patch("/reports/{report_id}")
async def resolve_abuse_report(
    report_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Act on an abuse report (admin only)."""
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid report ID format.")

    status_str = payload.get("status")
    if not status_str:
        raise HTTPException(status_code=400, detail="status is required.")

    try:
        status_enum = ReportStatus(status_str.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report status: {status_str}")

    result = await db.execute(select(PropertyReport).where(PropertyReport.id == rid))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    report.status = status_enum
    db.add(report)
    await db.commit()

    return {"message": "Report status updated.", "report_id": str(report.id), "status": report.status}


@router.get("/payments")
async def list_admin_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """List all system payments (admin only)."""
    result = await db.execute(select(Payment).order_by(Payment.created_at.desc()))
    payments = result.scalars().all()
    return [{
        "id": str(p.id),
        "user_id": str(p.user_id),
        "amount": p.amount,
        "status": p.status,
        "gateway": p.gateway,
        "gateway_order_id": p.gateway_order_id,
        "transaction_id": p.transaction_id,
        "created_at": p.created_at,
    } for p in payments]


@router.get("/analytics")
async def get_admin_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Fetch high-level business analytics stats."""
    # Count totals
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0

    prop_count = await db.execute(select(func.count(Property.id)))
    total_properties = prop_count.scalar() or 0

    payment_sum = await db.execute(select(func.sum(Payment.amount)))
    total_revenue = payment_sum.scalar() or 0.0

    unlock_count = await db.execute(select(func.count(ContactUnlock.id)))
    total_unlocks = unlock_count.scalar() or 0

    return {
        "revenue": total_revenue,
        "users_count": total_users,
        "properties_count": total_properties,
        "unlocks_count": total_unlocks,
    }


from app.models.notification import Notification, NotificationType

@router.post("/notifications/broadcast")
async def broadcast_announcement(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Broadcast admin announcement to target group of users."""
    title = payload.get("title")
    body = payload.get("body")
    target = payload.get("target", "all")  # "all", "owners", "buyers", "agents"

    if not title or not body:
        raise HTTPException(status_code=400, detail="Title and body are required.")

    # Determine targeted users query
    user_query = select(User)
    if target == "owners":
        user_query = user_query.where(User.user_type == UserType.OWNER)
    elif target == "buyers":
        user_query = user_query.where(User.user_type == UserType.BUYER)
    elif target == "agents":
        user_query = user_query.where(User.user_type == UserType.AGENT)

    result = await db.execute(user_query)
    users = result.scalars().all()

    sent_count = 0
    from app.services.notification_service import send_email_notification, get_html_email_template

    for user in users:
        # Create In-App Notification
        notif = Notification(
            user_id=user.id,
            type=NotificationType.ADMIN_ANNOUNCEMENT,
            title=title,
            body=body,
            link="/dashboard",
            is_read=False
        )
        db.add(notif)
        sent_count += 1

        # Send Email
        if user.email:
            try:
                html_body = get_html_email_template(title, body, "/dashboard")
                await send_email_notification(user.email, title, html_body)
            except Exception:
                pass

    await db.commit()
    return {"message": f"Successfully broadcasted to {sent_count} users.", "sent_count": sent_count}


@router.post("/reset-database")
async def reset_database(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Purge all test properties, images, contacts, and reset database to clean fresh state (Admin only)."""
    from sqlalchemy import text
    from app.models.user import User, UserType, UserStatus
    from app.core.security import hash_password

    try:
        # Delete test property data
        await db.execute(text("DELETE FROM property_images;"))
        await db.execute(text("DELETE FROM contact_unlocks;"))
        await db.execute(text("DELETE FROM favorites;"))
        await db.execute(text("DELETE FROM property_amenities;"))
        await db.execute(text("DELETE FROM property_views;"))
        await db.execute(text("DELETE FROM property_verifications;"))
        await db.execute(text("DELETE FROM property_reports;"))
        await db.execute(text("DELETE FROM notifications;"))
        await db.execute(text("DELETE FROM payments;"))
        await db.execute(text("DELETE FROM subscriptions;"))
        await db.execute(text("DELETE FROM properties;"))
        
        # Purge non-admin test users
        await db.execute(text("DELETE FROM users WHERE email != 'admin@aurahomes.in';"))
        
        # Ensure Super Admin exists
        import os
        admin_password = os.getenv("ADMIN_INITIAL_PASSWORD", "Admin@12345")
        admin_check = await db.execute(select(User).where(User.email == "admin@aurahomes.in"))
        admin_user = admin_check.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                name="Super Admin",
                email="admin@aurahomes.in",
                mobile="9893000000",
                password_hash=hash_password(admin_password),
                user_type=UserType.ADMIN,
                status=UserStatus.ACTIVE,
            )
            db.add(admin_user)
        
        await db.commit()
        return {"status": "success", "message": "Database cleared successfully! Portal is fresh and ready for production start."}
    except Exception as e:
        await db.rollback()
        return {"status": "partial_success", "message": f"Reset executed with note: {str(e)}"}


