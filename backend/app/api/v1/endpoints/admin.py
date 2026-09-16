from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import uuid
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, UserType
from app.models.property import Property, PropertyStatus
from app.models.location import Location
from app.models.category import Category
from app.models.notification import Notification, NotificationType, BroadcastNotification
from app.models.monetization import Payment, ContactUnlock, PaymentStatus

router = APIRouter()


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Admin dashboard stats — all values read from the production database."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

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

    # Total all-time revenue (completed payments)
    total_rev_check = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.status == PaymentStatus.SUCCESSFUL
        )
    )
    total_revenue = float(total_rev_check.scalar() or 0.0)

    # Sum today's revenue
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_rev_check = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.created_at >= today_start,
            Payment.status == PaymentStatus.SUCCESSFUL
        )
    )
    today_revenue = float(today_rev_check.scalar() or 0.0)

    # Count active subscriptions
    from app.models.monetization import Subscription, SubscriptionStatus
    active_sub_check = await db.execute(
        select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.ACTIVE)
    )
    active_subscriptions = active_sub_check.scalar() or 0

    # 7-day new users (for weekly chart)
    weekly_users = []
    weekly_props = []
    weekly_rev = []
    day_labels = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)

        u_res = await db.execute(
            select(func.count(User.id)).where(
                User.created_at >= day_start, User.created_at < day_end
            )
        )
        weekly_users.append(u_res.scalar() or 0)

        p_res = await db.execute(
            select(func.count(Property.id)).where(
                Property.created_at >= day_start, Property.created_at < day_end
            )
        )
        weekly_props.append(p_res.scalar() or 0)

        r_res = await db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.created_at >= day_start,
                Payment.created_at < day_end,
                Payment.status == PaymentStatus.SUCCESSFUL
            )
        )
        weekly_rev.append(float(r_res.scalar() or 0.0))
        day_labels.append(day_start.strftime("%a"))

    return {
        "stats": {
            "total_users": total_users,
            "total_properties": total_properties,
            "pending_properties": pending_properties,
            "published_properties": published_properties,
            "total_unlocks": total_unlocks,
            "total_revenue": total_revenue,
            "today_revenue": today_revenue,
            "active_subscriptions": active_subscriptions,
        },
        "weekly_users": weekly_users,
        "weekly_props": weekly_props,
        "weekly_rev": weekly_rev,
        "day_labels": day_labels,
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
    prop.is_verified = True
    db.add(prop)
    await db.commit()

    # Trigger property approved notification to owner
    from app.services.notification_service import (
        send_property_approved_notification,
        trigger_matching_saved_search_alerts
    )
    if prop.owner_id:
        await send_property_approved_notification(
            user_id=prop.owner_id,
            property_id=prop.id,
            property_title=prop.title,
            db=db
        )

    # Trigger alerts matching loop for saved searches
    await trigger_matching_saved_search_alerts(db, prop)
    await db.commit()

    return {"message": "Property listing approved and published. Match alerts triggered.", "property_id": str(prop.id), "status": prop.status}


@router.post("/properties/{property_id}/reject")
async def reject_property(
    property_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Reject a property listing with a reason (admin only)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    reason = (payload.get("reason") or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required.")

    prop.status = PropertyStatus.REJECTED
    prop.rejection_reason = reason
    db.add(prop)
    await db.commit()

    # Notify owner about rejection
    if prop.owner_id:
        from app.models.notification import Notification, NotificationType
        notif = Notification(
            user_id=prop.owner_id,
            type=NotificationType.PROPERTY_REJECTED,
            title="Your listing was rejected",
            body=f"Your property \"{prop.title}\" was rejected. Reason: {reason}",
            link="/dashboard/properties",
            is_read=False,
        )
        db.add(notif)
        await db.commit()

    return {"message": "Property rejected. Owner notified.", "property_id": str(prop.id), "status": prop.status}


@router.post("/properties/{property_id}/verify")
async def verify_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Toggle property verification status (admin only)."""
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
    """List all registered users (admin only), including listings_count."""
    users_result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_result.scalars().all()

    # Fetch per-user property counts in a single query
    counts_result = await db.execute(
        select(Property.owner_id, func.count(Property.id).label("cnt"))
        .group_by(Property.owner_id)
    )
    listings_map: dict = {str(row[0]): row[1] for row in counts_result.fetchall()}

    return [{
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "mobile": u.mobile,
        "city": u.city,
        "user_type": str(u.user_type.value if hasattr(u.user_type, 'value') else u.user_type),
        "type": str(u.user_type.value if hasattr(u.user_type, 'value') else u.user_type),
        "status": str(u.status.value if hasattr(u.status, 'value') else u.status),
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "joined": u.created_at.strftime("%d %b %Y") if u.created_at else "—",
        "listings": listings_map.get(str(u.id), 0),
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
    """List all property listings for admin overview, including owner name, city, and location."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.owner), selectinload(Property.location))
        .order_by(Property.created_at.desc())
    )
    properties = result.scalars().all()
    return [{
        "id": str(p.id),
        "title": p.title,
        "purpose": p.purpose,
        "property_type": p.property_type,
        "price": p.price,
        "status": p.status,
        "is_featured": p.is_featured,
        "featured_until": p.featured_until.strftime("%Y-%m-%d") if p.featured_until else None,
        "is_verified": p.is_verified,
        "created_at": p.created_at,
        "city": p.location.city if p.location else None,
        "locality": p.location.locality if p.location else None,
        "owner": {
            "name": p.owner.name if p.owner else "Unknown",
            "email": p.owner.email if p.owner else None,
        } if p.owner else None,
        "rejection_reason": p.rejection_reason,
    } for p in properties]


@router.delete("/properties/{property_id}")
async def delete_admin_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Delete a property listing from database (Admin only) and record deletion for cross-device sync."""
    from app.models.property import DeactivatedProperty
    
    # 1. Store deactivated ID record so all devices filter it out
    try:
        deact = DeactivatedProperty(id=str(property_id))
        db.add(deact)
        await db.commit()
    except Exception:
        await db.rollback()

    # 2. Delete ORM property record and clean up Cloudinary assets if UUID
    try:
        pid = uuid.UUID(property_id)
        result = await db.execute(select(Property).where(Property.id == pid))
        prop = result.scalar_one_or_none()
        if prop:
            # Fetch associated images to delete Cloudinary assets
            from app.models.property import PropertyImage
            from app.services.storage_service import delete_many_from_cloudinary
            
            img_res = await db.execute(select(PropertyImage.cloudinary_public_id).where(PropertyImage.property_id == pid))
            public_ids = [pid_val for pid_val in img_res.scalars().all() if pid_val]
            
            if public_ids:
                delete_many_from_cloudinary(public_ids)

            await db.delete(prop)
            await db.commit()
    except ValueError:
        pass

    return {"message": "Property deleted successfully.", "property_id": property_id}


@router.patch("/properties/{property_id}/feature")
async def toggle_featured_property(
    property_id: str,
    payload: dict = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Toggle or set a listing's featured status and expiry date (admin only)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    result = await db.execute(select(Property).where(Property.id == pid))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    payload = payload or {}
    desired_featured = payload.get("is_featured")
    if desired_featured is not None:
        prop.is_featured = bool(desired_featured)
    else:
        prop.is_featured = not prop.is_featured

    if prop.is_featured:
        expiry_val = payload.get("featured_until") or payload.get("expiry")
        if expiry_val:
            try:
                if "T" in str(expiry_val):
                    prop.featured_until = datetime.fromisoformat(str(expiry_val).replace("Z", "+00:00"))
                else:
                    prop.featured_until = datetime.strptime(str(expiry_val), "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except Exception:
                prop.featured_until = datetime.now(timezone.utc) + timedelta(days=30)
        else:
            if not prop.featured_until:
                prop.featured_until = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        prop.featured_until = None

    db.add(prop)
    await db.commit()

    return {
        "message": "Featured status updated.",
        "property_id": str(prop.id),
        "is_featured": prop.is_featured,
        "featured_until": prop.featured_until.strftime("%Y-%m-%d") if prop.featured_until else None
    }


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
    """Fetch real business analytics from the database."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # ── Overall totals ─────────────────────────────────────────────────────────
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_properties = (await db.execute(select(func.count(Property.id)))).scalar() or 0
    total_revenue = float((await db.execute(select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.SUCCESSFUL))).scalar() or 0.0)
    total_unlocks = (await db.execute(select(func.count(ContactUnlock.id)))).scalar() or 0

    # ── 7-day totals (for top stat cards) ─────────────────────────────────────
    views_7d_res = await db.execute(
        text("SELECT COUNT(*) FROM property_views WHERE viewed_at >= :since")
        .bindparams(since=seven_days_ago)
    )
    views_7d = views_7d_res.scalar() or 0

    unlocks_7d_res = await db.execute(
        select(func.count(ContactUnlock.id)).where(ContactUnlock.unlocked_at >= seven_days_ago)
    )
    unlocks_7d = unlocks_7d_res.scalar() or 0

    revenue_7d_res = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.created_at >= seven_days_ago,
            Payment.status == PaymentStatus.SUCCESSFUL
        )
    )
    revenue_7d = float(revenue_7d_res.scalar() or 0.0)

    # ── Daily revenue for last 7 days (bar chart) ──────────────────────────────
    daily_revenue = []
    day_labels = []
    for i in range(6, -1, -1):  # 6 days ago -> today
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        day_rev_res = await db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.created_at >= day_start,
                Payment.created_at < day_end,
                Payment.status == PaymentStatus.SUCCESSFUL
            )
        )
        daily_revenue.append(float(day_rev_res.scalar() or 0.0))
        day_labels.append(day_start.strftime("%a"))  # Mon, Tue...

    # ── Top cities by published listing count ──────────────────────────────────
    cities_res = await db.execute(
        select(Location.city, func.count(Property.id).label("cnt"))
        .join(Property, Property.location_id == Location.id)
        .where(Property.status == PropertyStatus.PUBLISHED, Location.city.isnot(None))
        .group_by(Location.city)
        .order_by(func.count(Property.id).desc())
        .limit(5)
    )
    cities_rows = cities_res.fetchall()
    max_city_count = cities_rows[0][1] if cities_rows else 1
    top_cities = [
        {
            "city": str(row[0].value if hasattr(row[0], "value") else row[0]),
            "count": row[1],
            "pct": round((row[1] / max_city_count) * 100) if max_city_count else 0,
        }
        for row in cities_rows
    ]

    # ── Property type distribution ─────────────────────────────────────────────
    types_res = await db.execute(
        select(Property.property_type, func.count(Property.id).label("cnt"))
        .where(Property.property_type.isnot(None))
        .group_by(Property.property_type)
        .order_by(func.count(Property.id).desc())
    )
    types_rows = types_res.fetchall()
    total_typed = sum(r[1] for r in types_rows) or 1
    property_types = [
        {
            "type": str(row[0].value if hasattr(row[0], "value") else row[0]),
            "count": row[1],
            "pct": round((row[1] / total_typed) * 100),
        }
        for row in types_rows
    ]

    # ── Conversion funnel (real counts) ───────────────────────────────────────
    total_views_res = await db.execute(text("SELECT COUNT(*) FROM property_views"))
    total_views = total_views_res.scalar() or 0

    # Properties with at least one view = "Contact Page Seen" proxy
    props_with_views_res = await db.execute(
        text("SELECT COUNT(DISTINCT property_id) FROM property_views")
    )
    props_with_views = props_with_views_res.scalar() or 0

    unlock_attempted_res = await db.execute(select(func.count(ContactUnlock.id)))
    unlock_attempted = unlock_attempted_res.scalar() or 0

    payments_completed_res = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == "completed")
    )
    payments_completed = payments_completed_res.scalar() or 0

    funnel = [
        {"stage": "Property Views",    "count": total_views},
        {"stage": "Contact Page Seen", "count": props_with_views},
        {"stage": "Unlock Attempted",  "count": unlock_attempted},
        {"stage": "Credits Purchased", "count": payments_completed},
        {"stage": "Contact Unlocked",  "count": total_unlocks},
    ]

    return {
        # Summary cards
        "revenue": total_revenue,
        "users_count": total_users,
        "properties_count": total_properties,
        "unlocks_count": total_unlocks,
        # 7-day stats
        "views_7d": views_7d,
        "unlocks_7d": unlocks_7d,
        "revenue_7d": revenue_7d,
        # Charts
        "daily_revenue": daily_revenue,
        "day_labels": day_labels,
        "top_cities": top_cities,
        "property_types": property_types,
        "funnel": funnel,
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

    # Save persistent BroadcastNotification record
    broadcast_record = BroadcastNotification(
        sender_id=current_user.id,
        title=title,
        body=body,
        target=target,
        sent_count=sent_count,
    )
    db.add(broadcast_record)
    await db.commit()
    await db.refresh(broadcast_record)

    return {
        "message": f"Successfully broadcasted to {sent_count} users.",
        "sent_count": sent_count,
        "id": str(broadcast_record.id),
        "date": broadcast_record.created_at.strftime("%d/%m/%Y") if broadcast_record.created_at else "",
    }


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


# ─── Notification History ──────────────────────────────────────────────────

@router.get("/notifications/history")
async def get_notification_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Retrieve persistent broadcast notification history."""
    result = await db.execute(
        select(BroadcastNotification).order_by(BroadcastNotification.created_at.desc())
    )
    broadcasts = result.scalars().all()
    return [{
        "id": str(b.id),
        "title": b.title,
        "body": b.body,
        "target": b.target,
        "sent": b.sent_count,
        "date": b.created_at.strftime("%d/%m/%Y") if b.created_at else "",
        "created_at": b.created_at.isoformat() if b.created_at else None,
    } for b in broadcasts]


# ─── Locations Management ──────────────────────────────────────────────────

DEFAULT_LOCATIONS = [
    {"city": "Bhopal", "state": "Madhya Pradesh"},
    {"city": "Indore", "state": "Madhya Pradesh"},
    {"city": "Jaipur", "state": "Rajasthan"},
    {"city": "Pune", "state": "Maharashtra"},
    {"city": "Bengaluru", "state": "Karnataka"},
    {"city": "Hyderabad", "state": "Telangana"},
]

@router.get("/locations")
async def list_admin_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Get all locations with property listing counts."""
    result = await db.execute(select(Location).order_by(Location.city.asc()))
    locations = result.scalars().all()

    if not locations:
        for loc_data in DEFAULT_LOCATIONS:
            loc = Location(city=loc_data["city"], state=loc_data["state"], is_active=True)
            db.add(loc)
        await db.commit()
        result = await db.execute(select(Location).order_by(Location.city.asc()))
        locations = result.scalars().all()

    props_result = await db.execute(select(Property.location_id, Location.city, func.count(Property.id)).join(Location, Property.location_id == Location.id, isouter=True).group_by(Property.location_id, Location.city))
    counts_by_id = {}
    counts_by_city = {}
    for loc_id, city_name, cnt in props_result.all():
        if loc_id:
            counts_by_id[str(loc_id)] = cnt
        if city_name:
            counts_by_city[city_name.lower()] = counts_by_city.get(city_name.lower(), 0) + cnt

    res = []
    for loc in locations:
        cnt = counts_by_id.get(str(loc.id), 0)
        if cnt == 0 and loc.city:
            cnt = counts_by_city.get(loc.city.lower(), 0)
        res.append({
            "id": str(loc.id),
            "city": loc.city,
            "state": getattr(loc, "state", None) or "India",
            "listings": cnt,
            "active": getattr(loc, "is_active", True) if getattr(loc, "is_active", None) is not None else True,
            "created_at": loc.created_at.isoformat() if hasattr(loc, "created_at") and loc.created_at else None,
        })
    return res


@router.post("/locations")
async def create_admin_location(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Add a new city/location."""
    city = payload.get("city", "").strip()
    state = payload.get("state", "").strip()
    if not city:
        raise HTTPException(status_code=400, detail="City name is required.")

    loc = Location(city=city, state=state or "India", is_active=True)
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return {
        "id": str(loc.id),
        "city": loc.city,
        "state": getattr(loc, "state", state or "India"),
        "listings": 0,
        "active": getattr(loc, "is_active", True),
    }


@router.put("/locations/{location_id}")
async def update_admin_location(
    location_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Update city/location name and state."""
    try:
        lid = uuid.UUID(location_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid location ID.")

    result = await db.execute(select(Location).where(Location.id == lid))
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")

    if "city" in payload:
        loc.city = payload["city"].strip()
    if "state" in payload:
        loc.state = payload["state"].strip()

    db.add(loc)
    await db.commit()
    return {"id": str(loc.id), "city": loc.city, "state": getattr(loc, "state", None), "active": getattr(loc, "is_active", True)}


@router.patch("/locations/{location_id}/toggle")
async def toggle_admin_location(
    location_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Toggle active/hidden status of a location."""
    try:
        lid = uuid.UUID(location_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid location ID.")

    result = await db.execute(select(Location).where(Location.id == lid))
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")

    loc.is_active = not getattr(loc, "is_active", True)
    db.add(loc)
    await db.commit()
    return {"id": str(loc.id), "city": loc.city, "active": loc.is_active}


@router.delete("/locations/{location_id}")
async def delete_admin_location(
    location_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Delete a location."""
    try:
        lid = uuid.UUID(location_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid location ID.")

    result = await db.execute(select(Location).where(Location.id == lid))
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")

    await db.delete(loc)
    await db.commit()
    return {"message": "Location deleted successfully."}


# ─── Categories Management ─────────────────────────────────────────────────

DEFAULT_CATEGORIES = [
    {"name": "Apartment", "icon": "🏢", "sort_order": 1},
    {"name": "Villa/House", "icon": "🏡", "sort_order": 2},
    {"name": "Commercial", "icon": "🏪", "sort_order": 3},
    {"name": "Plot/Land", "icon": "🌳", "sort_order": 4},
    {"name": "PG/Hostel", "icon": "🛏️", "sort_order": 5},
    {"name": "Farm House", "icon": "🌾", "sort_order": 6},
]

@router.get("/categories")
async def list_admin_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Get all property categories with listing counts."""
    result = await db.execute(select(Category).order_by(Category.sort_order.asc(), Category.name.asc()))
    cats = result.scalars().all()

    if not cats:
        for cat_data in DEFAULT_CATEGORIES:
            cat = Category(name=cat_data["name"], icon=cat_data["icon"], sort_order=cat_data["sort_order"], is_active=True)
            db.add(cat)
        await db.commit()
        result = await db.execute(select(Category).order_by(Category.sort_order.asc(), Category.name.asc()))
        cats = result.scalars().all()

    props_result = await db.execute(select(Property.property_type, func.count(Property.id)).group_by(Property.property_type))
    counts = { (pt or "").lower(): cnt for pt, cnt in props_result.all() }

    res = []
    for c in cats:
        key = c.name.lower().split("/")[0]
        match_cnt = sum(cnt for pt_key, cnt in counts.items() if key in pt_key)
        res.append({
            "id": str(c.id),
            "name": c.name,
            "icon": c.icon or "🏠",
            "listings": match_cnt,
            "active": c.is_active,
            "sort_order": c.sort_order,
        })
    return res


@router.post("/categories")
async def create_admin_category(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Create new property category."""
    name = payload.get("name", "").strip()
    icon = payload.get("icon", "🏠").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required.")

    cat = Category(name=name, icon=icon, is_active=True)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return {"id": str(cat.id), "name": cat.name, "icon": cat.icon, "listings": 0, "active": cat.is_active}


@router.put("/categories/{category_id}")
async def update_admin_category(
    category_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Update category details."""
    try:
        cid = uuid.UUID(category_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid category ID.")

    result = await db.execute(select(Category).where(Category.id == cid))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    if "name" in payload:
        cat.name = payload["name"].strip()
    if "icon" in payload:
        cat.icon = payload["icon"].strip()

    db.add(cat)
    await db.commit()
    return {"id": str(cat.id), "name": cat.name, "icon": cat.icon, "active": cat.is_active}


@router.patch("/categories/{category_id}/toggle")
async def toggle_admin_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Toggle active/inactive status of category."""
    try:
        cid = uuid.UUID(category_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid category ID.")

    result = await db.execute(select(Category).where(Category.id == cid))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    cat.is_active = not cat.is_active
    db.add(cat)
    await db.commit()
    return {"id": str(cat.id), "name": cat.name, "active": cat.is_active}


@router.delete("/categories/{category_id}")
async def delete_admin_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Delete a category."""
    try:
        cid = uuid.UUID(category_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid category ID.")

    result = await db.execute(select(Category).where(Category.id == cid))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    await db.delete(cat)
    await db.commit()
    return {"message": "Category deleted successfully."}



