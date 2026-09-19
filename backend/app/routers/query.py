"""AI Land Query — a small retrieval-based assistant.

Answers are produced ONLY from the LandStack demo dataset: we detect the parcel reference and
the question intent, fetch the matching records and compose an answer with its data sources.
Nothing is generated from outside knowledge; unknown or missing data is stated explicitly.
"""
import re

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Parcel, User
from ..schemas import QueryIn
from ..security import get_current_user
from .. import serializers as S
from .parcels import LOAD

router = APIRouter(prefix="/api/query", tags=["ai land query"])

INTENTS = [
    ("land_use", ["land use", "landuse", "land-use", "used for", "classification", "agricultur", "residential", "commercial"]),
    ("registration", ["regist", "deed", "sale deed", "sro", "stamp"]),
    ("encumbrance", ["encumb", "mortgage", "loan", "lien", "court", "charge", "ec "]),
    ("building", ["building", "permission", "permit", "construct"]),
    ("zoning", ["zone", "zoning", "fsi", "master plan", "height", "setback", "planning"]),
    ("ownership", ["owner", "ownership", "title", "mutation", "ror", "khata", "who owns"]),
    ("tax", ["tax", "dues", "due", "property tax", "paid"]),
    ("area", ["area", "size", "acre", "sqm", "square", "big"]),
    ("verification", ["verif", "validated", "authentic"]),
    ("ulpin", ["ulpin", "bhu-aadhaar", "unique"]),
    ("location", ["where", "located", "location", "village", "district", "state"]),
    ("utilities", ["water", "electric", "utility", "utilities"]),
]
PRETTY = lambda s: (s or "").replace("_", " ")


def detect_intents(q: str) -> list[str]:
    ql = f" {q.lower()} "
    return [name for name, keys in INTENTS if any(k in ql for k in keys)]


def answer_for(intent: str, p: Parcel) -> tuple[str, str]:
    pid = p.parcel_id
    if intent == "land_use":
        lu = S.land_use_out(p)
        extra = f" ({lu['sub_category']}), classified by {lu['classification_source']}; conversion status: {PRETTY(lu['conversion_status'])}" if "sub_category" in lu else ""
        return f"The land use of parcel {pid} is **{p.land_use}**{extra}.", "land_use"
    if intent == "registration":
        reg = S.registration_out(p)
        if not reg["records"]:
            return f"No registration record is available for parcel {pid} — it appears **unregistered** in the dataset.", "registration_records"
        r = reg["records"][0]
        yes = "is **registered**" if reg["status"] == "registered" else f"has registration status **{PRETTY(reg['status'])}**"
        return (f"Yes, parcel {pid} {yes}. Latest document {r['document_no']} ({r['deed_type']}) at {r['sro_office']} on {r['registered_on']}."
                if reg["status"] == "registered" else f"Parcel {pid} {yes}. Latest document {r['document_no']} ({r['deed_type']})."), "registration_records"
    if intent == "encumbrance":
        enc = S.encumbrance_out(p)
        active = [e for e in enc["records"] if e["status"] == "active"]
        if not active:
            return f"Parcel {pid} is **free of active encumbrances** in the dataset.", "encumbrances"
        items = "; ".join(f"{PRETTY(e['type'])} with {e['holder']}" + (f" (₹{e['amount']:,.0f})" if e["amount"] else "") for e in active)
        return f"Parcel {pid} **has {len(active)} active encumbrance(s)**: {items}.", "encumbrances"
    if intent == "building":
        pl = S.planning_out(p)
        if not pl["available"]:
            return f"No planning or building-permission record is available for parcel {pid}.", "planning_records"
        permit = f" Permit no. {pl['permit_no']} dated {pl['permit_date']}." if pl["permit_no"] else ""
        return f"Building permission status for parcel {pid}: **{PRETTY(pl['building_permission_status'])}**.{permit}", "planning_records"
    if intent == "zoning":
        pl = S.planning_out(p)
        if not pl["available"]:
            return f"No zoning information is available for parcel {pid}.", "planning_records"
        return (f"Parcel {pid} falls in the **{pl['zone']}** under {pl['master_plan']} — permissible FSI {pl['fsi']}, "
                f"max height {pl['max_height_m']} m, setback {pl['setback_m']} m."), "planning_records"
    if intent == "ownership":
        own = S.ownership_out(p)
        cur = [o for o in own["records"] if o["is_current"]]
        if not cur:
            return f"No current ownership record is available for parcel {pid}.", "ownership_records"
        names = ", ".join(f"{o['owner_name']} ({o['share_pct']:.0f}%)" for o in cur)
        return (f"Parcel {pid} ownership status: **{PRETTY(own['status'])}**. Current recorded holder(s) (masked): {names}; "
                f"RoR {cur[0]['ror_number']}, mutation {PRETTY(cur[0]['mutation_status'])}."), "ownership_records"
    if intent == "tax":
        due = f" Outstanding: ₹{p.tax_due:,.0f}." if p.tax_due else ""
        return f"Property tax for parcel {pid} (assessment {p.tax_assessment_no}) is **{p.tax_status}**; last paid {p.tax_last_paid or 'not recorded'}.{due}", "parcels.property_tax"
    if intent == "area":
        return f"Parcel {pid} has an area of **{p.area_sqm:,.0f} sq m** ({p.area_sqm / 4046.86:.2f} acres).", "parcels"
    if intent == "verification":
        return f"Parcel {pid} verification status is **{p.verification_status}**.", "parcels"
    if intent == "ulpin":
        return f"The ULPIN (Bhu-Aadhaar) of parcel {pid} is **{p.ulpin}**.", "parcels"
    if intent == "location":
        return f"Parcel {pid} (Survey No. {p.survey_no}) is located in **{p.village}, {p.district}, {p.state}**.", "parcels"
    if intent == "utilities":
        return f"Utilities for parcel {pid}: water — **{p.water_connection}**, electricity — **{p.electricity_connection}**.", "parcels.utilities"
    return "", ""


@router.post("")
def ask(body: QueryIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = body.question.strip()
    ref = re.search(r"\bP\s*-?\s*(\d{3,6})\b", q, re.I)
    ulpin = re.search(r"\b[A-Z0-9]{14}\b", q.upper())
    parcel = None
    if ref:
        parcel = db.scalar(select(Parcel).options(*LOAD).where(Parcel.parcel_id == f"P-{ref.group(1)}"))
    elif ulpin:
        parcel = db.scalar(select(Parcel).options(*LOAD).where(Parcel.ulpin == ulpin.group(0)))

    if not parcel:
        if ref or ulpin:
            return {"answer": f"I couldn't find parcel **{ref.group(0).upper() if ref else ulpin.group(0)}** in the LandStack dataset. "
                              "Please check the Parcel ID or ULPIN.", "parcel_id": None, "sources": [], "found": False}
        return {"answer": "Please mention a Parcel ID (for example **P-1024**) or a 14-character ULPIN so I can look up the records. "
                          "I answer only from LandStack's parcel dataset.", "parcel_id": None, "sources": [], "found": False}

    intents = detect_intents(q) or ["summary"]
    if intents == ["summary"]:
        s = S.parcel_summary(parcel)
        return {"answer": (f"Here is what LandStack holds for parcel **{parcel.parcel_id}** (ULPIN {parcel.ulpin}): "
                           f"{parcel.area_sqm:,.0f} sq m of **{parcel.land_use}** land in {parcel.village}, {parcel.district}. "
                           f"Ownership: {PRETTY(s['ownership_status'])}; registration: {PRETTY(s['registration_status'])}; "
                           f"encumbrance: {s['encumbrance_status']}; building permission: {PRETTY(s['building_permission'])}. "
                           "I couldn't map your question to a specific record, so I've shown a summary."),
                "parcel_id": parcel.parcel_id, "sources": ["parcels"], "found": True}
    parts, sources = [], []
    for i in intents[:3]:
        text, src = answer_for(i, parcel)
        if text:
            parts.append(text)
            sources.append(src)
    return {"answer": " ".join(parts), "parcel_id": parcel.parcel_id, "sources": sorted(set(sources)), "found": True}
