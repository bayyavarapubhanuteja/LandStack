from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..database import get_db
from ..models import AuditLog, Department, Parcel, ServiceRequest, User
from ..schemas import StatusUpdateIn, UserUpdateIn, VerifyParcelIn
from ..security import require_admin, require_staff
from ..serializers import audit_out, request_out, user_out
from .parcels import get_parcel
from .requests import STATUS_LABEL

router = APIRouter(prefix="/api/admin", tags=["admin"])

ALLOWED_TRANSITIONS = {
    "submitted": {"under_review", "rejected"},
    "under_review": {"department_verification", "rejected"},
    "department_verification": {"completed", "rejected"},
    "completed": set(), "rejected": set(),
}


@router.get("/requests")
def all_requests(status: str | None = None, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    stmt = select(ServiceRequest).order_by(ServiceRequest.created_at.desc())
    if status:
        stmt = stmt.where(ServiceRequest.status == status)
    return [request_out(r, include_user=True) for r in db.scalars(stmt).all()]


@router.patch("/requests/{request_id}")
def update_request(request_id: str, body: StatusUpdateIn, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    r = db.scalar(select(ServiceRequest).where(ServiceRequest.request_id == request_id.upper()))
    if not r:
        raise HTTPException(404, "Request not found")
    if body.status not in ALLOWED_TRANSITIONS[r.status]:
        raise HTTPException(400, f"Cannot move request from '{STATUS_LABEL[r.status]}' to '{STATUS_LABEL[body.status]}'")
    r.status = body.status
    r.officer_remarks = body.remarks or r.officer_remarks
    r.timeline = [*(r.timeline or []), {"status": body.status, "label": STATUS_LABEL[body.status],
                   "at": datetime.utcnow().isoformat(), "by": f"{user.name} ({user.role})", "note": body.remarks or ""}]
    audit.log(db, user, "request.status_update", "service_request", r.request_id, f"→ {body.status}. {body.remarks or ''}")
    db.commit()
    return request_out(r, include_user=True)


@router.patch("/parcels/{parcel_id}/verification")
def verify_parcel(parcel_id: str, body: VerifyParcelIn, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    p = get_parcel(db, parcel_id)
    old = p.verification_status
    p.verification_status = body.status
    audit.log(db, user, "parcel.verification", "parcel", p.parcel_id, f"{old} → {body.status}. {body.remarks or ''}")
    db.commit()
    return {"parcel_id": p.parcel_id, "verification_status": p.verification_status}


@router.get("/audit")
def audit_logs(entity_id: str | None = None, limit: int = Query(100, le=500),
               db: Session = Depends(get_db), _: User = Depends(require_staff)):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if entity_id:
        stmt = stmt.where(AuditLog.entity_id == entity_id.upper())
    return [audit_out(a) for a in db.scalars(stmt).all()]


@router.get("/users")
def users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return [user_out(u) for u in db.scalars(select(User).order_by(User.created_at)).all()]


@router.patch("/users/{user_id}")
def update_user(user_id: int, body: UserUpdateIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == admin.id:
        raise HTTPException(400, "You cannot change your own role or status")
    if body.role is not None:
        u.role = body.role
    if body.is_active is not None:
        u.is_active = body.is_active
    audit.log(db, admin, "user.update", "user", str(u.id), f"role={u.role}, active={u.is_active}")
    db.commit()
    return user_out(u)


@router.get("/integrations")
def integrations(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    return [{"code": x.code, "name": x.name, "dataset": x.dataset, "record_count": x.record_count,
             "coverage_pct": x.coverage_pct, "status": x.status, "api_endpoint": x.api_endpoint,
             "last_sync": x.last_sync.isoformat(), "mock": True}
            for x in db.scalars(select(Department).order_by(Department.id)).all()]


@router.post("/integrations/{code}/sync")
def sync(code: str, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    dept = db.scalar(select(Department).where(Department.code == code))
    if not dept:
        raise HTTPException(404, "Integration not found")
    dept.last_sync = datetime.utcnow()
    if dept.status == "offline":
        raise HTTPException(503, f"{dept.name} mock endpoint is offline — sync failed (simulated)")
    dept.status = "connected"
    audit.log(db, user, "integration.sync", "department", dept.code, "Simulated sync")
    db.commit()
    return {"code": dept.code, "status": dept.status, "last_sync": dept.last_sync.isoformat()}
