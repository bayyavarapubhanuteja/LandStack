-- LandStack PostgreSQL + PostGIS schema (reference; the app creates it via SQLAlchemy + app.database.enable_postgis)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(160) UNIQUE NOT NULL, phone VARCHAR(20),
  password_hash VARCHAR(128) NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'citizen', department VARCHAR(120),
  is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT now());
CREATE TABLE departments (id SERIAL PRIMARY KEY, code VARCHAR(30) UNIQUE, name VARCHAR(120), dataset VARCHAR(160), record_count INT,
  coverage_pct FLOAT, status VARCHAR(20), api_endpoint VARCHAR(200), last_sync TIMESTAMP);
CREATE TABLE parcels (id SERIAL PRIMARY KEY, parcel_id VARCHAR(20) UNIQUE NOT NULL, ulpin CHAR(14) UNIQUE NOT NULL, survey_no VARCHAR(30),
  state VARCHAR(60), district VARCHAR(60), village VARCHAR(60), area_sqm FLOAT, land_use VARCHAR(40), verification_status VARCHAR(20),
  boundary JSONB NOT NULL, geom geometry(Polygon, 4326), centroid_lat FLOAT, centroid_lng FLOAT,
  tax_assessment_no VARCHAR(30), tax_status VARCHAR(20), tax_due FLOAT, tax_last_paid DATE,
  water_connection VARCHAR(30), electricity_connection VARCHAR(30), updated_at TIMESTAMP DEFAULT now());
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geom);
CREATE TABLE ownership_records (id SERIAL PRIMARY KEY, parcel_pk INT REFERENCES parcels(id) ON DELETE CASCADE, owner_name VARCHAR(120),
  owner_type VARCHAR(30), share_pct FLOAT, ror_number VARCHAR(40), khata_no VARCHAR(30), mutation_status VARCHAR(30), acquired_on DATE, is_current BOOLEAN);
CREATE TABLE registration_records (id SERIAL PRIMARY KEY, parcel_pk INT REFERENCES parcels(id) ON DELETE CASCADE, document_no VARCHAR(40),
  deed_type VARCHAR(40), sro_office VARCHAR(80), registered_on DATE, market_value FLOAT, stamp_duty FLOAT, status VARCHAR(20));
CREATE TABLE land_use (id SERIAL PRIMARY KEY, parcel_pk INT UNIQUE REFERENCES parcels(id) ON DELETE CASCADE, category VARCHAR(40),
  sub_category VARCHAR(60), classification_source VARCHAR(80), conversion_status VARCHAR(40), classified_on DATE);
CREATE TABLE planning_records (id SERIAL PRIMARY KEY, parcel_pk INT UNIQUE REFERENCES parcels(id) ON DELETE CASCADE, zone VARCHAR(60),
  master_plan VARCHAR(80), fsi FLOAT, max_height_m FLOAT, setback_m FLOAT, building_permission_status VARCHAR(30), permit_no VARCHAR(40), permit_date DATE);
CREATE TABLE encumbrances (id SERIAL PRIMARY KEY, parcel_pk INT REFERENCES parcels(id) ON DELETE CASCADE, type VARCHAR(40), holder VARCHAR(120),
  amount FLOAT, start_date DATE, end_date DATE, status VARCHAR(20));
CREATE TABLE service_requests (id SERIAL PRIMARY KEY, request_id VARCHAR(24) UNIQUE, user_id INT REFERENCES users(id), parcel_id VARCHAR(20),
  service_type VARCHAR(40), purpose TEXT, status VARCHAR(30), priority VARCHAR(10), department VARCHAR(80), timeline JSONB,
  officer_remarks TEXT, created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
CREATE TABLE audit_logs (id SERIAL PRIMARY KEY, actor_id INT REFERENCES users(id), actor_email VARCHAR(160), action VARCHAR(60),
  entity_type VARCHAR(40), entity_id VARCHAR(40), details TEXT, created_at TIMESTAMP DEFAULT now());
