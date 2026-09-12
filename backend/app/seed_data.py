from datetime import datetime

from sqlalchemy.orm import Session

from app.models.appointment import Appointment


def seed_appointments(db: Session) -> None:
    if db.query(Appointment).count() > 0:
        return

    sample_appointments = [
        Appointment(
            title="Sprint planning",
            description="Plan the next development sprint",
            start_time=datetime(2026, 9, 12, 9, 0),
            end_time=datetime(2026, 9, 12, 10, 0),
            status="scheduled",
        ),
        Appointment(
            title="Project kickoff",
            description="Review project goals and responsibilities",
            start_time=datetime(2026, 9, 12, 10, 30),
            end_time=datetime(2026, 9, 12, 11, 30),
            status="completed",
        ),
        Appointment(
            title="Design review",
            description="Review the updated appointment board designs",
            start_time=datetime(2026, 9, 12, 13, 0),
            end_time=datetime(2026, 9, 12, 14, 0),
            status="cancelled",
        ),
        Appointment(
            title="Intern demo",
            description="Demonstrate the completed API workflow",
            start_time=datetime(2026, 9, 13, 10, 0),
            end_time=datetime(2026, 9, 13, 11, 0),
            status="scheduled",
        ),
    ]
    db.add_all(sample_appointments)
    db.commit()