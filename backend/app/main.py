from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from sqlalchemy import func, select

from .database import Base, SessionLocal, engine, enable_postgis
from .models import Parcel
from .routers import admin, analytics, auth, parcels, query, requests

app = FastAPI(
    title="LandStack API",
    description="Integrated GIS-based Digital Public Infrastructure for Land Governance (demo). "
                "All data is fictional; department integrations are simulated.",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_origin_regex=r"https://.*\.onrender\.com",
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    msgs = []
    for e in exc.errors():
        field = ".".join(str(x) for x in e["loc"][1:]) or "request"
        msgs.append(f"{field}: {e['msg'].removeprefix('Value error, ')}")
    return JSONResponse(status_code=422, content={"detail": "; ".join(msgs)})


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(engine)
    enable_postgis()
    if settings.auto_seed:
        with SessionLocal() as db:
            empty = not db.scalar(select(func.count(Parcel.id)))
        if empty:  # fresh deployment — load the demo dataset once
            from .seed import seed
            seed()


for r in (auth.router, parcels.router, requests.router, admin.router, analytics.router, query.router):
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"status": "ok", "database": "postgis" if settings.is_postgres else "sqlite"}
