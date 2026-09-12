from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.appointment import (
	AppointmentCreate,
	AppointmentResponse,
	AppointmentStatus,
	AppointmentUpdate,
)
from app.services import appointment_service

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _raise_service_error(error: Exception) -> None:
	if isinstance(error, appointment_service.AppointmentNotFoundError):
		raise HTTPException(status_code=404, detail=str(error)) from error
	if isinstance(error, appointment_service.AppointmentConflictError):
		raise HTTPException(status_code=409, detail=str(error)) from error
	if isinstance(error, ValueError):
		raise HTTPException(status_code=400, detail=str(error)) from error
	raise error


@router.get("", response_model=list[AppointmentResponse])
def get_appointments(
	appointment_date: date | None = Query(default=None, alias="date"),
	status_filter: AppointmentStatus | None = Query(default=None, alias="status"),
	db: Session = Depends(get_db),
):
	return appointment_service.get_appointments(db, appointment_date, status_filter)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
	try:
		return appointment_service.get_appointment_by_id(db, appointment_id)
	except Exception as error:
		_raise_service_error(error)


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
	appointment_data: AppointmentCreate, db: Session = Depends(get_db)
):
	try:
		return appointment_service.create_appointment(db, appointment_data)
	except Exception as error:
		db.rollback()
		_raise_service_error(error)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
	appointment_id: int,
	appointment_data: AppointmentUpdate,
	db: Session = Depends(get_db),
):
	try:
		return appointment_service.update_appointment(db, appointment_id, appointment_data)
	except Exception as error:
		db.rollback()
		_raise_service_error(error)


@router.patch("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(appointment_id: int, db: Session = Depends(get_db)):
	try:
		return appointment_service.complete_appointment(db, appointment_id)
	except Exception as error:
		db.rollback()
		_raise_service_error(error)


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
	try:
		return appointment_service.cancel_appointment(db, appointment_id)
	except Exception as error:
		db.rollback()
		_raise_service_error(error)
