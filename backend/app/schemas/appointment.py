from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AppointmentStatus = Literal["scheduled", "completed", "cancelled"]


class AppointmentBase(BaseModel):
	title: Annotated[str, Field(min_length=1, max_length=255)]
	description: str | None = None
	start_time: datetime
	end_time: datetime

	@field_validator("title")
	@classmethod
	def title_must_not_be_blank(cls, value: str) -> str:
		if not value.strip():
			raise ValueError("Title cannot be empty or whitespace only")
		return value.strip()


class AppointmentCreate(AppointmentBase):
	pass


class AppointmentUpdate(BaseModel):
	title: Annotated[str | None, Field(min_length=1, max_length=255)] = None
	description: str | None = None
	start_time: datetime | None = None
	end_time: datetime | None = None

	@field_validator("title")
	@classmethod
	def title_must_not_be_blank(cls, value: str | None) -> str | None:
		if value is not None:
			if not value.strip():
				raise ValueError("Title cannot be empty or whitespace only")
			return value.strip()
		return value


class AppointmentResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	title: str
	description: str | None
	start_time: datetime
	end_time: datetime
	status: AppointmentStatus
	created_at: datetime
	updated_at: datetime
