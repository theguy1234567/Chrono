from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models import appointment  # noqa: F401 - registers the model with Base
from app.routes.appointments import router as appointments_router
from app.seed_data import seed_appointments


@asynccontextmanager
async def lifespan(_: FastAPI):
	Base.metadata.create_all(bind=engine)
	with SessionLocal() as db:
		seed_appointments(db)
	yield


app = FastAPI(
	title="Appointment Board API",
	description="API for managing team appointments.",
	version="1.0.0",
	lifespan=lifespan,
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:5174",
		"http://127.0.0.1:5174",
		"http://localhost:3000",
		"http://127.0.0.1:3000",
	],
	allow_credentials=True,
	allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"],
	allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root() -> dict[str, str]:
	return {"message": "Appointment Board API is running"}


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
	return {"status": "healthy"}


app.include_router(appointments_router)
