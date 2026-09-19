# LandStack

**One Parcel. One Identity. One Unified Land Governance Platform.**

LandStack is an integrated GIS-based Digital Public Infrastructure prototype for land governance (Smart India Hackathon). It links cadastral parcels, ULPIN, RoR/ownership, registration, land use, zoning, building permissions, encumbrances and citizen services through one parcel-centric platform.

> All parcels, owners and department integrations are **fictional demo data**. The integrations are simulated.

## Stack
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Leaflet, Recharts, Lucide icons
- **Backend:** Python FastAPI, SQLAlchemy, JWT (PyJWT) + bcrypt, role-based access, audit logging
- **Database:** PostgreSQL + PostGIS (a SQLite fallback runs automatically if `DATABASE_URL` is not set)

## Quick start

### 1. Database (PostGIS, recommended)
```bash
docker compose up -d
cp backend/.env.example backend/.env   # set JWT_SECRET
```
Skip this step to use the built-in SQLite fallback.

### 2. Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed               # 18 demo parcels P-1021 … P-1038
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The dev server forwards `/api` requests to the backend.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Citizen | citizen@landstack.demo | Citizen@123 |
| Government Officer | officer@landstack.demo | Officer@123 |
| Administrator | admin@landstack.demo | Admin@123 |

## Demo flow
1. Sign in as **Citizen** → **Parcel Explorer** → search `P-1024` → click the parcel on the map
2. Open **Unified parcel details** (Overview / Ownership / Registration / Land Use / Planning / Encumbrance / Services)
3. **Ask AI** → “What is the land use of parcel P-1024?” / “Is parcel P-1024 registered?”
4. **Request service** → Ownership Verification → note the Request ID (`LS-2026-…`)
5. Sign out → sign in as **Admin/Officer** → **Service Requests** → move it to Under Review → Department Verification → Completed
6. Sign in as the Citizen again → **My Requests** shows the updated timeline

## Key APIs
```
GET  /api/parcels/{parcelId}
GET  /api/parcels/{parcelId}/ownership | registration | land-use | planning | encumbrance | services
GET  /api/parcels/geojson?state=&district=&village=&land_use=&verification=
POST /api/requests                 GET /api/requests/mine        GET /api/requests/{requestId}
POST /api/query                    GET /api/analytics/summary
PATCH /api/admin/requests/{id}     PATCH /api/admin/parcels/{id}/verification
GET  /api/admin/audit              GET /api/admin/integrations   GET/PATCH /api/admin/users
```

## Security
Passwords are hashed with bcrypt. The API uses JWT bearer tokens and has citizen, officer and admin roles. Admin routes are protected. Inputs are validated with Pydantic. Request status changes must follow the workflow order, and owner names are masked. Secrets are read from `.env`. Every write action is recorded in `audit_logs`.

## Schema
The tables are `users`, `parcels` (with a PostGIS `geom` column and a GIST index), `ownership_records`, `registration_records`, `land_use`, `planning_records`, `encumbrances`, `service_requests`, `departments` and `audit_logs`. See `backend/db/schema.sql`.
