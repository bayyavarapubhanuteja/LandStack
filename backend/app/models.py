from datetime import datetime, date

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(20), default="citizen")  # citizen | officer | admin
    department: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    dataset: Mapped[str] = mapped_column(String(160))
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    coverage_pct: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(20), default="connected")  # connected | degraded | offline
    api_endpoint: Mapped[str] = mapped_column(String(200))
    last_sync: Mapped[datetime] = mapped_column(DateTime, default=now)


class Parcel(Base):
    __tablename__ = "parcels"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    ulpin: Mapped[str] = mapped_column(String(14), unique=True, index=True)
    survey_no: Mapped[str] = mapped_column(String(30))
    state: Mapped[str] = mapped_column(String(60), index=True)
    district: Mapped[str] = mapped_column(String(60), index=True)
    village: Mapped[str] = mapped_column(String(60), index=True)
    area_sqm: Mapped[float] = mapped_column(Float)
    land_use: Mapped[str] = mapped_column(String(40), index=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="pending")  # verified | pending | flagged
    boundary: Mapped[dict] = mapped_column(JSON)  # GeoJSON Polygon (mirrored into PostGIS geom)
    centroid_lat: Mapped[float] = mapped_column(Float)
    centroid_lng: Mapped[float] = mapped_column(Float)
    tax_assessment_no: Mapped[str] = mapped_column(String(30))
    tax_status: Mapped[str] = mapped_column(String(20))  # paid | due | overdue
    tax_due: Mapped[float] = mapped_column(Float, default=0)
    tax_last_paid: Mapped[date | None] = mapped_column(Date)
    water_connection: Mapped[str] = mapped_column(String(30))
    electricity_connection: Mapped[str] = mapped_column(String(30))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    ownership: Mapped[list["OwnershipRecord"]] = relationship(back_populates="parcel", cascade="all, delete-orphan")
    registrations: Mapped[list["RegistrationRecord"]] = relationship(back_populates="parcel", cascade="all, delete-orphan")
    land_use_record: Mapped["LandUse | None"] = relationship(back_populates="parcel", uselist=False, cascade="all, delete-orphan")
    planning: Mapped["PlanningRecord | None"] = relationship(back_populates="parcel", uselist=False, cascade="all, delete-orphan")
    encumbrances: Mapped[list["Encumbrance"]] = relationship(back_populates="parcel", cascade="all, delete-orphan")


class OwnershipRecord(Base):
    __tablename__ = "ownership_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_pk: Mapped[int] = mapped_column(ForeignKey("parcels.id", ondelete="CASCADE"), index=True)
    owner_name: Mapped[str] = mapped_column(String(120))  # stored masked for demo
    owner_type: Mapped[str] = mapped_column(String(30))  # individual | joint | government | institution
    share_pct: Mapped[float] = mapped_column(Float, default=100)
    ror_number: Mapped[str] = mapped_column(String(40))
    khata_no: Mapped[str] = mapped_column(String(30))
    mutation_status: Mapped[str] = mapped_column(String(30))  # approved | pending | disputed
    acquired_on: Mapped[date] = mapped_column(Date)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    parcel: Mapped[Parcel] = relationship(back_populates="ownership")


class RegistrationRecord(Base):
    __tablename__ = "registration_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_pk: Mapped[int] = mapped_column(ForeignKey("parcels.id", ondelete="CASCADE"), index=True)
    document_no: Mapped[str] = mapped_column(String(40))
    deed_type: Mapped[str] = mapped_column(String(40))
    sro_office: Mapped[str] = mapped_column(String(80))
    registered_on: Mapped[date] = mapped_column(Date)
    market_value: Mapped[float] = mapped_column(Float)
    stamp_duty: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20))  # registered | pending | unregistered
    parcel: Mapped[Parcel] = relationship(back_populates="registrations")


class LandUse(Base):
    __tablename__ = "land_use"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_pk: Mapped[int] = mapped_column(ForeignKey("parcels.id", ondelete="CASCADE"), unique=True)
    category: Mapped[str] = mapped_column(String(40))
    sub_category: Mapped[str] = mapped_column(String(60))
    classification_source: Mapped[str] = mapped_column(String(80))
    conversion_status: Mapped[str] = mapped_column(String(40))
    classified_on: Mapped[date] = mapped_column(Date)
    parcel: Mapped[Parcel] = relationship(back_populates="land_use_record")


class PlanningRecord(Base):
    __tablename__ = "planning_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_pk: Mapped[int] = mapped_column(ForeignKey("parcels.id", ondelete="CASCADE"), unique=True)
    zone: Mapped[str] = mapped_column(String(60))
    master_plan: Mapped[str] = mapped_column(String(80))
    fsi: Mapped[float] = mapped_column(Float)
    max_height_m: Mapped[float] = mapped_column(Float)
    setback_m: Mapped[float] = mapped_column(Float)
    building_permission_status: Mapped[str] = mapped_column(String(30))  # approved | pending | not_applied | rejected
    permit_no: Mapped[str | None] = mapped_column(String(40))
    permit_date: Mapped[date | None] = mapped_column(Date)
    parcel: Mapped[Parcel] = relationship(back_populates="planning")


class Encumbrance(Base):
    __tablename__ = "encumbrances"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_pk: Mapped[int] = mapped_column(ForeignKey("parcels.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(40))  # mortgage | lease | court_case | lien
    holder: Mapped[str] = mapped_column(String(120))
    amount: Mapped[float | None] = mapped_column(Float)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20))  # active | released
    parcel: Mapped[Parcel] = relationship(back_populates="encumbrances")


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    parcel_id: Mapped[str] = mapped_column(String(20), index=True)
    service_type: Mapped[str] = mapped_column(String(40))
    purpose: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="submitted")
    priority: Mapped[str] = mapped_column(String(10), default="normal")
    department: Mapped[str] = mapped_column(String(80))
    timeline: Mapped[list] = mapped_column(JSON, default=list)
    officer_remarks: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)
    user: Mapped[User] = relationship()


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    actor_email: Mapped[str | None] = mapped_column(String(160))
    action: Mapped[str] = mapped_column(String(60), index=True)
    entity_type: Mapped[str] = mapped_column(String(40))
    entity_id: Mapped[str] = mapped_column(String(40), index=True)
    details: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, index=True)
