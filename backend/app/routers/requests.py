from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import audit
from ..database import get_db
from ..models import Parcel, ServiceRequest, User
from ..schemas import ServiceRequestIn
from ..security import STAFF_ROLES, get_current_user
from ..serializers import request_out

router = APIRouter(prefix="/api/requests", tags=["service requests"])

SERVICE_DEPARTMENT = {
    "ownership_verification": "Revenue Department – Land Records",
    "land_record_request": "Revenue Department – Land Records",
    "encumbrance_certificate": "Registration & Stamps Department",
    "land_use_information": "Town & Country Planning",
    "building_permission_status": "Town & Country Planning",
}
STATUS_LABEL = {
    "submitted": "Submitted", "under_review": "Under Review",
    "department_verification": "Department Verification", "completed": "Completed", "rejected": "Rejected",
}


def next_request_id(db: Session) -> str:
    n = (db.scalar(select(func.count(ServiceRequest.id))) or 0) + 1
    rid = f"LS-{datetime.utcnow().year}-{n:06d}"
    while db.scalar(select(ServiceRequest).where(ServiceRequest.request_id == rid)):
        n += 1
        rid = f"LS-{datetime.utcnow().year}-{n:06d}"
    return rid


@router.post("", status_code=201)
def create(body: ServiceRequestIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.scalar(select(Parcel).where(Parcel.parcel_id == body.parcel_id)):
        raise HTTPException(404, f"Parcel {body.parcel_id} not found")
    open_dup = db.scalar(select(ServiceRequest).where(
        ServiceRequest.user_id == user.id, ServiceRequest.parcel_id == body.parcel_id,
        ServiceRequest.service_type == body.service_type,
        ServiceRequest.status.notin_(["completed", "rejected"])))
    if open_dup:
        raise HTTPException(409, f"You already have an open request ({open_dup.request_id}) for this service")
    now = datetime.utcnow().isoformat()
    r = ServiceRequest(
        request_id=next_request_id(db), user_id=user.id, parcel_id=body.parcel_id,
        service_type=body.service_type, purpose=body.purpose.strip(),
        department=SERVICE_DEPARTMENT[body.service_type], status="submitted",
        timeline=[{"status": "submitted", "label": "Submitted", "at": now, "by": user.name,
                   "note": "Request received via LandStack citizen portal"}],
    )
    db.add(r)
    audit.log(db, user, "request.create", "service_request", r.request_id, f"{body.service_type} for {body.parcel_id}")
    db.commit()
    return request_out(r)


@router.get("/mine")
def mine(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(ServiceRequest).where(ServiceRequest.user_id == user.id)
                      .order_by(ServiceRequest.created_at.desc())).all()
    return [request_out(r) for r in rows]


@router.get("/{request_id}")
def track(request_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.scalar(select(ServiceRequest).where(ServiceRequest.request_id == request_id.upper()))
    if not r or (r.user_id != user.id and user.role not in STAFF_ROLES):
        raise HTTPException(404, "Request not found")
    return request_out(r, include_user=user.role in STAFF_ROLES)
