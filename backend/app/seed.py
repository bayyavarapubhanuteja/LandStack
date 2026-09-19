"""Seed LandStack with 18 fictional demo parcels and linked department records.

Run: python -m app.seed   (drops and recreates all tables)
All names, numbers and records are fictional. Owner names are stored masked.
"""
import math
import random
from datetime import date, datetime, timedelta

from .database import Base, SessionLocal, engine, enable_postgis, sync_postgis_geometry
from .models import (AuditLog, Department, Encumbrance, LandUse, OwnershipRecord, Parcel, PlanningRecord,
                     RegistrationRecord, ServiceRequest, User)
from .security import hash_password

rng = random.Random(1024)

CLUSTERS = [
    {"state": "Telangana", "district": "Rangareddy", "village": "Shamshabad", "code": "TS36RR", "sro": "SRO Shamshabad",
     "origin": (17.2410, 78.4280), "plan": "HMDA Master Plan 2031", "start": 1021},
    {"state": "Telangana", "district": "Medchal-Malkajgiri", "village": "Kompally", "code": "TS37MK", "sro": "SRO Medchal",
     "origin": (17.5370, 78.4840), "plan": "HMDA Master Plan 2031", "start": 1027},
    {"state": "Karnataka", "district": "Bengaluru Urban", "village": "Yelahanka", "code": "KA29BU", "sro": "SRO Yelahanka",
     "origin": (13.1010, 77.5960), "plan": "BDA Revised Master Plan 2031", "start": 1033},
]
COLS, ROWS, CELL = 3, 2, 0.0019

# Per-parcel profile: land use, verification, ownership state, registration state, encumbrance, building permission, tax
PROFILES = {
    1021: ("Agricultural", "verified", "approved", "registered", None, "not_applied", "paid"),
    1022: ("Agricultural", "pending", "pending", "registered", "lease", "not_applied", "due"),
    1023: ("Residential", "verified", "approved", "registered", None, "approved", "paid"),
    1024: ("Residential", "verified", "approved", "registered", "mortgage", "approved", "paid"),
    1025: ("Commercial", "verified", "approved", "registered", None, "pending", "due"),
    1026: ("Public/Semi-Public", "verified", "approved", "registered", None, "approved", "paid"),
    1027: ("Residential", "pending", "pending", "pending", None, "pending", "due"),
    1028: ("Industrial", "verified", "approved", "registered", "mortgage", "approved", "paid"),
    1029: ("Agricultural", "flagged", "disputed", "registered", "court_case", "not_applied", "overdue"),
    1030: ("Residential", "verified", "approved", "registered", None, "approved", "paid"),
    1031: ("Mixed Use", "pending", "approved", "registered", None, "rejected", "due"),
    1032: ("Recreational/Open Space", "verified", "approved", "registered", None, "not_applied", "paid"),
    1033: ("Residential", "verified", "approved", "registered", "mortgage", "approved", "paid"),
    1034: ("Commercial", "verified", "approved", "registered", None, "approved", "paid"),
    1035: ("Agricultural", "pending", "pending", "unregistered", None, "not_applied", "overdue"),
    1036: ("Residential", "flagged", "disputed", "registered", "court_case", "pending", "due"),
    1037: ("Industrial", "verified", "approved", "registered", None, "approved", "paid"),
    1038: ("Mixed Use", "verified", "approved", "registered", "lien", "pending", "paid"),
}
ZONES = {
    "Agricultural": ("Agricultural Zone", 0.5, 7, 3), "Residential": ("Residential Zone R1", 2.0, 15, 3),
    "Commercial": ("Commercial Zone C1", 3.0, 24, 6), "Industrial": ("Industrial Zone I1", 1.5, 18, 9),
    "Mixed Use": ("Mixed Use Zone M1", 2.5, 21, 4.5), "Public/Semi-Public": ("Public & Semi-Public Zone", 1.8, 18, 6),
    "Recreational/Open Space": ("Recreational Zone", 0.2, 6, 6),
}
SUBCAT = {"Agricultural": "Wet land – paddy", "Residential": "Plotted development", "Commercial": "Retail & offices",
          "Industrial": "Light manufacturing", "Mixed Use": "Residential-cum-commercial",
          "Public/Semi-Public": "Community health centre", "Recreational/Open Space": "Neighbourhood park"}
FIRST = ["Ramesh", "Lakshmi", "Suresh", "Anitha", "Venkat", "Priya", "Mahesh", "Kavitha", "Srinivas", "Deepa",
         "Harish", "Meena", "Ravi", "Sunita", "Arjun", "Padma", "Kiran", "Swathi"]
LAST = ["Reddy", "Rao", "Kumar", "Sharma", "Naidu", "Gowda", "Patel", "Iyer", "Varma", "Shetty"]
BANKS = ["State Bank of India", "Canara Bank", "Union Bank of India", "HDFC Bank", "Bank of Baroda"]


def mask(name: str) -> str:
    first, last = name.split()
    return f"{first[0]}{'*' * (len(first) - 2)}{first[-1]} {last[0]}{'*' * (len(last) - 1)}"


def rand_date(y0: int, y1: int) -> date:
    return date(y0, 1, 1) + timedelta(days=rng.randint(0, (y1 - y0) * 365))


def area_sqm(ring: list[list[float]]) -> float:
    lat0 = math.radians(sum(p[1] for p in ring) / len(ring))
    pts = [(p[0] * 111320 * math.cos(lat0), p[1] * 110540) for p in ring]
    return abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1] for i in range(len(pts) - 1))) / 2


def grid(origin):
    lat0, lng0 = origin
    verts = {}
    for r in range(ROWS + 1):
        for c in range(COLS + 1):
            edge = r in (0, ROWS) or c in (0, COLS)
            j = CELL * (0.12 if edge else 0.22)
            verts[(r, c)] = [round(lng0 + c * CELL * 1.15 + rng.uniform(-j, j), 6),
                             round(lat0 - r * CELL + rng.uniform(-j, j), 6)]
    return verts


def ulpin(code: str, pid: int) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return f"{code}{pid:04d}" + "".join(rng.choice(alphabet) for _ in range(4))


def seed() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    enable_postgis()
    db = SessionLocal()

    users = [
        User(name="Asha Citizen", email="citizen@landstack.demo", phone="9000000001",
             password_hash=hash_password("Citizen@123"), role="citizen"),
        User(name="Rahul Verma", email="citizen2@landstack.demo", phone="9000000002",
             password_hash=hash_password("Citizen@123"), role="citizen"),
        User(name="K. Srinivas (Tahsildar)", email="officer@landstack.demo", phone="9000000010",
             password_hash=hash_password("Officer@123"), role="officer", department="Revenue Department"),
        User(name="LandStack Administrator", email="admin@landstack.demo", phone="9000000099",
             password_hash=hash_password("Admin@123"), role="admin", department="State Land Governance Cell"),
    ]
    db.add_all(users)

    now = datetime.utcnow()
    db.add_all([
        Department(code="LAND_RECORDS", name="Revenue Department – Land Records", dataset="RoR / Record of Rights & Cadastral Maps",
                   record_count=184_320, coverage_pct=96, status="connected", api_endpoint="mock://revenue/ror/v1", last_sync=now - timedelta(minutes=14)),
        Department(code="REGISTRATION", name="Registration & Stamps Department", dataset="Registered Deeds & Encumbrance Index",
                   record_count=92_415, coverage_pct=88, status="connected", api_endpoint="mock://igrs/deeds/v2", last_sync=now - timedelta(hours=1, minutes=5)),
        Department(code="PLANNING", name="Town & Country Planning", dataset="Master Plan Zoning & Building Permissions",
                   record_count=41_870, coverage_pct=74, status="connected", api_endpoint="mock://dtcp/zoning/v1", last_sync=now - timedelta(hours=3)),
        Department(code="PROPERTY_TAX", name="Municipal Property Tax", dataset="Property Tax Assessments & Payments",
                   record_count=67_902, coverage_pct=81, status="degraded", api_endpoint="mock://ulb/ptax/v1", last_sync=now - timedelta(hours=9)),
        Department(code="UTILITIES", name="Utilities (Water & Power)", dataset="Water & Electricity Service Connections",
                   record_count=58_114, coverage_pct=63, status="offline", api_endpoint="mock://utilities/connections/v1", last_sync=now - timedelta(days=2)),
    ])

    name_i = 0
    for cl in CLUSTERS:
        verts = grid(cl["origin"])
        n = cl["start"]
        for r in range(ROWS):
            for c in range(COLS):
                ring = [verts[(r, c)], verts[(r, c + 1)], verts[(r + 1, c + 1)], verts[(r + 1, c)], verts[(r, c)]]
                lu, ver, mut, reg, enc, bp, tax = PROFILES[n]
                area = round(area_sqm(ring), 1)
                p = Parcel(
                    parcel_id=f"P-{n}", ulpin=ulpin(cl["code"], n), survey_no=f"{rng.randint(100, 480)}/{rng.choice('ABCD')}{rng.randint(1, 4)}",
                    state=cl["state"], district=cl["district"], village=cl["village"], area_sqm=area, land_use=lu,
                    verification_status=ver, boundary={"type": "Polygon", "coordinates": [ring]},
                    centroid_lat=round(sum(v[1] for v in ring[:-1]) / 4, 6), centroid_lng=round(sum(v[0] for v in ring[:-1]) / 4, 6),
                    tax_assessment_no=f"PTIN-{cl['code'][:2]}-{rng.randint(100000, 999999)}", tax_status=tax,
                    tax_due=0 if tax == "paid" else float(rng.randrange(2500, 48000, 250)),
                    tax_last_paid=rand_date(2024, 2026) if tax != "overdue" else rand_date(2021, 2023),
                    water_connection=rng.choice(["Active", "Active", "Not connected"]) if lu != "Agricultural" else "Borewell (self)",
                    electricity_connection="Active" if lu != "Recreational/Open Space" else "Street lighting only",
                )
                # Ownership: previous + current holders
                acquired = rand_date(2008, 2022)
                prev = f"{FIRST[(name_i + 5) % len(FIRST)]} {LAST[(name_i + 3) % len(LAST)]}"
                p.ownership.append(OwnershipRecord(owner_name=mask(prev), owner_type="individual", share_pct=100,
                                                   ror_number=f"ROR/{cl['code'][:2]}/{n}/{acquired.year - 7}", khata_no=f"K-{rng.randint(1000, 9999)}",
                                                   mutation_status="approved", acquired_on=acquired - timedelta(days=2600), is_current=False))
                if lu == "Public/Semi-Public":
                    p.ownership.append(OwnershipRecord(owner_name="Government of " + cl["state"], owner_type="government", share_pct=100,
                                                       ror_number=f"ROR/{cl['code'][:2]}/{n}/{acquired.year}", khata_no=f"K-{rng.randint(1000, 9999)}",
                                                       mutation_status=mut, acquired_on=acquired))
                else:
                    joint = rng.random() < 0.3
                    for k in range(2 if joint else 1):
                        nm = f"{FIRST[name_i % len(FIRST)]} {LAST[(name_i + k) % len(LAST)]}"
                        p.ownership.append(OwnershipRecord(owner_name=mask(nm), owner_type="joint" if joint else "individual",
                                                           share_pct=50 if joint else 100, ror_number=f"ROR/{cl['code'][:2]}/{n}/{acquired.year}",
                                                           khata_no=f"K-{rng.randint(1000, 9999)}", mutation_status=mut, acquired_on=acquired))
                name_i += 1
                # Registration
                if reg != "unregistered":
                    mv = round(area * rng.uniform(2500, 18000), -3)
                    p.registrations.append(RegistrationRecord(document_no=f"{rng.randint(1000, 9999)}/{acquired.year - 7}",
                                                              deed_type="Sale Deed", sro_office=cl["sro"], registered_on=acquired - timedelta(days=2600),
                                                              market_value=round(mv * 0.6, -3), stamp_duty=round(mv * 0.6 * 0.055, -2), status="registered"))
                    p.registrations.append(RegistrationRecord(document_no=f"{rng.randint(1000, 9999)}/{acquired.year}",
                                                              deed_type=rng.choice(["Sale Deed", "Gift Settlement Deed", "Partition Deed"]),
                                                              sro_office=cl["sro"], registered_on=acquired, market_value=mv,
                                                              stamp_duty=round(mv * 0.055, -2), status=reg))
                p.land_use_record = LandUse(category=lu, sub_category=SUBCAT[lu],
                                            classification_source=f"{cl['plan'].split()[0]} land-use survey",
                                            conversion_status="converted (NALA)" if lu not in ("Agricultural", "Recreational/Open Space") else "not required",
                                            classified_on=rand_date(2019, 2025))
                zone, fsi, h, sb = ZONES[lu]
                p.planning = PlanningRecord(zone=zone, master_plan=cl["plan"], fsi=fsi, max_height_m=h, setback_m=sb,
                                            building_permission_status=bp,
                                            permit_no=f"BP/{cl['code'][:2]}/{rng.randint(2019, 2026)}/{rng.randint(1000, 9999)}" if bp == "approved" else None,
                                            permit_date=rand_date(2019, 2026) if bp == "approved" else None)
                if enc:
                    holder = {"mortgage": rng.choice(BANKS), "lease": "M/s Green Fields Agro (lessee)",
                              "court_case": f"Civil Court, {cl['district']} – O.S. No. {rng.randint(10, 400)}/2024",
                              "lien": rng.choice(BANKS)}[enc]
                    p.encumbrances.append(Encumbrance(type=enc, holder=holder, amount=None if enc == "court_case" else float(rng.randrange(800000, 6500000, 50000)),
                                                      start_date=rand_date(2021, 2025), end_date=rand_date(2027, 2036) if enc in ("mortgage", "lease") else None, status="active"))
                if rng.random() < 0.4:
                    p.encumbrances.append(Encumbrance(type="mortgage", holder=rng.choice(BANKS), amount=float(rng.randrange(300000, 2000000, 50000)),
                                                      start_date=rand_date(2012, 2016), end_date=rand_date(2018, 2021), status="released"))
                db.add(p)
                n += 1
    db.flush()

    # A few historical requests so dashboards and admin queues are not empty
    def tl(*steps):
        base = now - timedelta(days=12)
        return [{"status": s, "label": s.replace("_", " ").title(), "at": (base + timedelta(days=i * 2)).isoformat(),
                 "by": "Asha Citizen" if i == 0 else "K. Srinivas (officer)", "note": ""} for i, s in enumerate(steps)]
    samples = [
        ("LS-2026-000001", users[0], "P-1030", "encumbrance_certificate", "completed", "Registration & Stamps Department",
         tl("submitted", "under_review", "department_verification", "completed")),
        ("LS-2026-000002", users[1], "P-1033", "land_use_information", "under_review", "Town & Country Planning", tl("submitted", "under_review")),
        ("LS-2026-000003", users[1], "P-1027", "ownership_verification", "department_verification", "Revenue Department – Land Records",
         tl("submitted", "under_review", "department_verification")),
        ("LS-2026-000004", users[0], "P-1025", "building_permission_status", "submitted", "Town & Country Planning", tl("submitted")),
        ("LS-2026-000005", users[1], "P-1036", "land_record_request", "submitted", "Revenue Department – Land Records", tl("submitted")),
    ]
    for rid, u, pid, st, status, dept, timeline in samples:
        db.add(ServiceRequest(request_id=rid, user_id=u.id, parcel_id=pid, service_type=st, purpose="Required for bank loan / personal records",
                              status=status, department=dept, timeline=timeline, created_at=now - timedelta(days=12)))
    db.add(AuditLog(actor_email="system", action="seed.load", entity_type="system", entity_id="SEED", details="Loaded 18 demo parcels"))
    db.commit()
    db.close()
    sync_postgis_geometry()
    print("Seeded 18 parcels (P-1021 … P-1038), 4 users, 5 departments, 5 service requests.")


if __name__ == "__main__":
    seed()
