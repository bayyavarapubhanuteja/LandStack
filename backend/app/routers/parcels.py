from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Parcel, User
from ..security import get_current_user
from .. import serializers as S

router = APIRouter(prefix="/api/parcels", tags=["parcels"])

LOAD = (selectinload(Parcel.ownership), selectinload(Parcel.registrations), selectinload(Parcel.land_use_record),
        selectinload(Parcel.planning), selectinload(Parcel.encumbrances))


def filtered(db: Session, q=None, state=None, district=None, village=None, land_use=None, verification=None):
    stmt = select(Parcel).options(*LOAD).order_by(Parcel.parcel_id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Parcel.parcel_id.ilike(like), Parcel.ulpin.ilike(like),
                              Parcel.survey_no.ilike(like), Parcel.village.ilike(like)))
    for col, val in ((Parcel.state, state), (Parcel.district, district), (Parcel.village, village),
                     (Parcel.land_use, land_use), (Parcel.verification_status, verification)):
        if val:
            stmt = stmt.where(col == val)
    return db.scalars(stmt).all()


def get_parcel(db: Session, parcel_id: str) -> Parcel:
    p = db.scalar(select(Parcel).options(*LOAD).where(
        or_(Parcel.parcel_id == parcel_id.upper(), Parcel.ulpin == parcel_id.upper())))
    if not p:
        raise HTTPException(404, f"Parcel {parcel_id} not found")
    return p


@router.get("/geojson")
def geojson(q: str | None = None, state: str | None = None, district: str | None = None,
            village: str | None = None, land_use: str | None = None, verification: str | None = None,
            db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    parcels = filtered(db, q, state, district, village, land_use, verification)
    return {"type": "FeatureCollection", "features": [S.parcel_feature(p) for p in parcels]}


@router.get("/filters")
def filters(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.execute(select(Parcel.state, Parcel.district, Parcel.village).distinct()).all()
    return {
        "hierarchy": [{"state": s, "district": d, "village": v} for s, d, v in rows],
        "land_uses": sorted({x for x in db.scalars(select(Parcel.land_use).distinct())}),
        "verification": ["verified", "pending", "flagged"],
    }


@router.get("/search")
def search(q: str = Query(min_length=1, max_length=40), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [S.parcel_summary(p) for p in filtered(db, q)[:10]]


@router.get("")
def list_parcels(q: str | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [S.parcel_summary(p) for p in filtered(db, q)]


@router.get("/{parcel_id}")
def parcel(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = get_parcel(db, parcel_id)
    return {**S.parcel_summary(p), "geometry": p.boundary,
            "ownership": S.ownership_out(p), "registration": S.registration_out(p),
            "land_use_detail": S.land_use_out(p), "planning": S.planning_out(p),
            "encumbrance": S.encumbrance_out(p), "services": S.services_out(p)}


@router.get("/{parcel_id}/ownership")
def ownership(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return S.ownership_out(get_parcel(db, parcel_id))


@router.get("/{parcel_id}/registration")
def registration(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return S.registration_out(get_parcel(db, parcel_id))


@router.get("/{parcel_id}/land-use")
def land_use(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return S.land_use_out(get_parcel(db, parcel_id))


@router.get("/{parcel_id}/planning")
def planning(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return S.planning_out(get_parcel(db, parcel_id))


@router.get("/{parcel_id}/encumbrance")
def encumbrance(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return S.encumbrance_out(get_parcel(db, parcel_id))


@router.get("/{parcel_id}/services")
def services(parcel_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return S.services_out(get_parcel(db, parcel_id))
