import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()


def _get_database_url() -> str:
	database_url = os.getenv("DATABASE_URL")
	if not database_url:
		raise RuntimeError(
			"DATABASE_URL is missing. Add it to backend/.env, for example: "
			"DATABASE_URL=postgresql://username:password@localhost:5432/appointment_board"
		)
	return database_url


class Base(DeclarativeBase):
	pass


engine = create_engine(_get_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()
