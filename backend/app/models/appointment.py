from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Appointment(Base):
	__tablename__ = "appointments"
	__table_args__ = (
		Index("ix_appointments_start_time", "start_time"),
		Index("ix_appointments_status", "status"),
	)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	title: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
	end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
	status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
	created_at: Mapped[datetime] = mapped_column(
		DateTime, nullable=False, server_default=func.now()
	)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
	)
