# Appointment Board

Appointment management application with a FastAPI and PostgreSQL backend.

## Backend setup

1. Install Python 3.11 or newer and PostgreSQL.
2. Create a PostgreSQL database named `appointment_board`.
3. From `backend`, create a virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   .venv\\Scripts\\activate
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and set `DATABASE_URL`.
5. Start the API from `backend`:

   ```bash
   uvicorn app.main:app --reload
   ```

The API is available at `http://localhost:8000`. Swagger documentation is at
`http://localhost:8000/docs`.
