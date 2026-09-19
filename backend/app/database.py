from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def enable_postgis() -> None:
    """Create the PostGIS extension and a spatial geometry column mirrored from GeoJSON."""
    if not settings.is_postgres:
        return
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.execute(text("ALTER TABLE parcels ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom)"))


def sync_postgis_geometry() -> None:
    if not settings.is_postgres:
        return
    with engine.begin() as conn:
        conn.execute(text(
            "UPDATE parcels SET geom = ST_SetSRID(ST_GeomFromGeoJSON(boundary::text), 4326)"
        ))
