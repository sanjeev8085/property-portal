from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.property import Property, PropertyReport, ReportReason, ReportStatus

router = APIRouter()


@router.post("/{property_id}", status_code=status.HTTP_201_CREATED)
async def report_property(
    property_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit a report for a property listing."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    # Verify property exists
    prop_check = await db.execute(select(Property).where(Property.id == pid))
    if not prop_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Property not found.")

    reason_str = payload.get("reason")
    if not reason_str:
        raise HTTPException(status_code=400, detail="reason is required.")

    try:
        reason_enum = ReportReason(reason_str.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report reason: {reason_str}")

    report = PropertyReport(
        property_id=pid,
        reporter_id=current_user.id,
        reason=reason_enum,
        description=payload.get("description"),
        status=ReportStatus.PENDING,
    )
    db.add(report)
    await db.commit()

    return {"message": "Report submitted. Our team will review it.", "id": str(report.id)}

