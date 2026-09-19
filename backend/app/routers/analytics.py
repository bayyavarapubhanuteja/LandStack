from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Department, Parcel, ServiceRequest, User
from ..security import STAFF_ROLES, get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    parcels = db.scalars(select(Parcel)).all()
    reqs = db.scalars(select(ServiceRequest)).all()
    mine = [r for r in reqs if r.user_id == user.id]
    scope = reqs if user.role in STAFF_ROLES else mine
    depts = db.scalars(select(Department)).all()
    lu = Counter(p.land_use for p in parcels)
    ver = Counter(p.verification_status for p in parcels)
    svc = Counter(r.service_type for r in scope)
    st = Counter(r.status for r in scope)
    return {
        "total_parcels": len(parcels),
        "verified_parcels": ver.get("verified", 0),
        "pending_requests": sum(1 for r in scope if r.status not in ("completed", "rejected")),
        "completed_requests": st.get("completed", 0),
        "active_services": 5,
        "my_requests": len(mine),
        "total_area_acres": round(sum(p.area_sqm for p in parcels) / 4046.86, 1),
        "land_use_distribution": [{"name": k, "value": v} for k, v in lu.most_common()],
        "verification": [{"name": k, "value": ver.get(k, 0)} for k in ("verified", "pending", "flagged")],
        "service_requests": [{"name": k, "value": v} for k, v in svc.most_common()],
        "request_status": [{"name": k, "value": st.get(k, 0)} for k in
                           ("submitted", "under_review", "department_verification", "completed", "rejected")],
        "department_coverage": [{"name": d.name.split(" – ")[0].replace(" Department", ""), "value": d.coverage_pct} for d in depts],
        "by_district": [{"name": k, "value": v} for k, v in Counter(p.district for p in parcels).most_common()],
    }
