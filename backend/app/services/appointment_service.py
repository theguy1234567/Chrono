from datetime import date, datetime, time, timedelta

from sqlalchemy import Select, and_, select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate


class AppointmentNotFoundError(Exception):
	pass


class AppointmentConflictError(Exception):
	pass


def validate_time_range(start_time: datetime, end_time: datetime) -> None:
	if end_time <= start_time:
		raise ValueError("End time must be after start time")


def check_time_conflict(
	db: Session,
	start_time: datetime,
	end_time: datetime,
	exclude_id: int | None = None,
) -> None:
	query: Select[tuple[Appointment]] = select(Appointment).where(
		Appointment.status != "cancelled",
		Appointment.start_time < end_time,
		Appointment.end_time > start_time,
	)
	if exclude_id is not None:
		query = query.where(Appointment.id != exclude_id)

	if db.scalar(query) is not None:
		raise AppointmentConflictError(
			"The selected time slot conflicts with an existing appointment"
		)


def get_appointments(
	db: Session,
	appointment_date: date | None = None,
	status: str | None = None,
) -> list[Appointment]:
	query: Select[tuple[Appointment]] = select(Appointment)
	if appointment_date is not None:
		start_of_day = datetime.combine(appointment_date, time.min)
		start_of_next_day = start_of_day + timedelta(days=1)
		query = query.where(
			Appointment.start_time >= start_of_day,
			Appointment.start_time < start_of_next_day,
		)
	if status is not None:
		query = query.where(Appointment.status == status)
	query = query.order_by(Appointment.start_time.asc())
	return list(db.scalars(query).all())


def get_appointment_by_id(db: Session, appointment_id: int) -> Appointment:
	appointment = db.get(Appointment, appointment_id)
	if appointment is None:
		raise AppointmentNotFoundError("Appointment not found")
	return appointment


def create_appointment(db: Session, appointment_data: AppointmentCreate) -> Appointment:
	validate_time_range(appointment_data.start_time, appointment_data.end_time)
	check_time_conflict(db, appointment_data.start_time, appointment_data.end_time)

	appointment = Appointment(
		title=appointment_data.title,
		description=appointment_data.description,
		start_time=appointment_data.start_time,
		end_time=appointment_data.end_time,
		status="scheduled",
	)
	db.add(appointment)
	db.commit()
	db.refresh(appointment)
	return appointment


def update_appointment(
	db: Session, appointment_id: int, appointment_data: AppointmentUpdate
) -> Appointment:
	appointment = get_appointment_by_id(db, appointment_id)
	updates = appointment_data.model_dump(exclude_unset=True)

	final_start_time = updates.get("start_time", appointment.start_time)
	final_end_time = updates.get("end_time", appointment.end_time)
	validate_time_range(final_start_time, final_end_time)
	check_time_conflict(
		db,
		final_start_time,
		final_end_time,
		exclude_id=appointment.id,
	)

	for field, value in updates.items():
		setattr(appointment, field, value)
	db.commit()
	db.refresh(appointment)
	return appointment


def complete_appointment(db: Session, appointment_id: int) -> Appointment:
	appointment = get_appointment_by_id(db, appointment_id)
	if appointment.status == "cancelled":
		raise ValueError("Cancelled appointments cannot be completed")
	if appointment.status == "completed":
		return appointment

	appointment.status = "completed"
	db.commit()
	db.refresh(appointment)
	return appointment


def cancel_appointment(db: Session, appointment_id: int) -> Appointment:
	appointment = get_appointment_by_id(db, appointment_id)
	if appointment.status == "completed":
		raise ValueError("Completed appointments cannot be cancelled")
	if appointment.status == "cancelled":
		return appointment

	appointment.status = "cancelled"
	db.commit()
	db.refresh(appointment)
	return appointment
