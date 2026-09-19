"""Plain dict serializers. Ownership data is masked before leaving the API."""
from .models import AuditLog, Parcel, ServiceRequest, User


def d(v):
    return v.isoformat() if v else None


def user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "phone": u.phone, "role": u.role,
            "department": u.department, "is_active": u.is_active, "created_at": d(u.created_at)}


def current_owner(p: Parcel):
    return [o for o in p.ownership if o.is_current]


def registration_status(p: Parcel) -> str:
    if not p.registrations:
        return "unregistered"
    return sorted(p.registrations, key=lambda r: r.registered_on)[-1].status


def encumbrance_status(p: Parcel) -> str:
    return "encumbered" if any(e.status == "active" for e in p.encumbrances) else "clear"


def ownership_status(p: Parcel) -> str:
    owners = current_owner(p)
    if not owners:
        return "unrecorded"
    if any(o.mutation_status == "disputed" for o in owners):
        return "disputed"
    if any(o.mutation_status == "pending" for o in owners):
        return "mutation_pending"
    return "clear_title"


def parcel_summary(p: Parcel) -> dict:
    return {
        "parcel_id": p.parcel_id, "ulpin": p.ulpin, "survey_no": p.survey_no,
        "state": p.state, "district": p.district, "village": p.village,
        "area_sqm": p.area_sqm, "area_acres": round(p.area_sqm / 4046.86, 3),
        "land_use": p.land_use, "verification_status": p.verification_status,
        "ownership_status": ownership_status(p), "registration_status": registration_status(p),
        "encumbrance_status": encumbrance_status(p),
        "building_permission": p.planning.building_permission_status if p.planning else "not_applied",
        "zone": p.planning.zone if p.planning else None,
        "tax_status": p.tax_status, "tax_due": p.tax_due,
        "centroid": [p.centroid_lat, p.centroid_lng],
        "updated_at": d(p.updated_at),
    }


def parcel_feature(p: Parcel) -> dict:
    return {"type": "Feature", "id": p.parcel_id, "geometry": p.boundary, "properties": parcel_summary(p)}


def ownership_out(p: Parcel) -> dict:
    return {
        "parcel_id": p.parcel_id, "ulpin": p.ulpin, "status": ownership_status(p),
        "masked": True,
        "records": [{
            "owner_name": o.owner_name, "owner_type": o.owner_type, "share_pct": o.share_pct,
            "ror_number": o.ror_number, "khata_no": o.khata_no, "mutation_status": o.mutation_status,
            "acquired_on": d(o.acquired_on), "is_current": o.is_current,
        } for o in sorted(p.ownership, key=lambda o: o.acquired_on, reverse=True)],
    }


def registration_out(p: Parcel) -> dict:
    return {
        "parcel_id": p.parcel_id, "status": registration_status(p),
        "records": [{
            "document_no": r.document_no, "deed_type": r.deed_type, "sro_office": r.sro_office,
            "registered_on": d(r.registered_on), "market_value": r.market_value,
            "stamp_duty": r.stamp_duty, "status": r.status,
        } for r in sorted(p.registrations, key=lambda r: r.registered_on, reverse=True)],
    }


def land_use_out(p: Parcel) -> dict:
    lu = p.land_use_record
    return {"parcel_id": p.parcel_id, "category": p.land_use, **({
        "sub_category": lu.sub_category, "classification_source": lu.classification_source,
        "conversion_status": lu.conversion_status, "classified_on": d(lu.classified_on)} if lu else {})}


def planning_out(p: Parcel) -> dict:
    pl = p.planning
    if not pl:
        return {"parcel_id": p.parcel_id, "available": False}
    return {"parcel_id": p.parcel_id, "available": True, "zone": pl.zone, "master_plan": pl.master_plan,
            "fsi": pl.fsi, "max_height_m": pl.max_height_m, "setback_m": pl.setback_m,
            "building_permission_status": pl.building_permission_status,
            "permit_no": pl.permit_no, "permit_date": d(pl.permit_date)}


def encumbrance_out(p: Parcel) -> dict:
    return {"parcel_id": p.parcel_id, "status": encumbrance_status(p), "records": [{
        "type": e.type, "holder": e.holder, "amount": e.amount, "start_date": d(e.start_date),
        "end_date": d(e.end_date), "status": e.status} for e in p.encumbrances]}


def services_out(p: Parcel) -> dict:
    return {"parcel_id": p.parcel_id, "property_tax": {
        "assessment_no": p.tax_assessment_no, "status": p.tax_status, "due_amount": p.tax_due,
        "last_paid": d(p.tax_last_paid)},
        "utilities": {"water": p.water_connection, "electricity": p.electricity_connection}}


def request_out(r: ServiceRequest, include_user: bool = False) -> dict:
    out = {"request_id": r.request_id, "parcel_id": r.parcel_id, "service_type": r.service_type,
           "purpose": r.purpose, "status": r.status, "priority": r.priority, "department": r.department,
           "timeline": r.timeline or [], "officer_remarks": r.officer_remarks,
           "created_at": d(r.created_at), "updated_at": d(r.updated_at)}
    if include_user and r.user:
        out["applicant"] = {"name": r.user.name, "email": r.user.email}
    return out


def audit_out(a: AuditLog) -> dict:
    return {"id": a.id, "actor": a.actor_email or "system", "action": a.action, "entity_type": a.entity_type,
            "entity_id": a.entity_id, "details": a.details, "created_at": d(a.created_at)}
