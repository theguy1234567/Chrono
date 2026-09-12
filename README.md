# CHRONO Appointment Management Dashboard

CHRONO is a responsive appointment management dashboard built with React, TypeScript, Vite, FastAPI, SQLAlchemy, and PostgreSQL. It supports scheduling, conflict detection, appointment status management, calendar views, archive/restore workflows, CSV export, local persistence, and responsive mobile navigation.

## Features

- Dashboard with live greeting, date/time, KPIs, agenda, and mini calendar
- Appointment creation and editing with validation and conflict checking
- Appointment details, completion, cancellation, archiving, restoring, and deletion
- Search, status filters, sorting, and CSV export
- Month, week, and day calendar views
- Working-hours and appointment settings management
- LocalStorage persistence for frontend state and schedules
- PostgreSQL persistence through the FastAPI backend
- Responsive desktop, tablet, and mobile layouts
- Mobile bottom navigation with quick appointment creation
- Toast notifications and loading feedback while conflicts are checked

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Native browser APIs: `fetch`, `localStorage`, `Blob`, and `URL`

### Backend

- Python 3.11+
- FastAPI
- Uvicorn
- SQLAlchemy 2
- Pydantic 2
- PostgreSQL
- Psycopg 2 binary driver

## Architecture

```mermaid
flowchart LR
    User[User] --> UI[React + TypeScript UI]
    UI --> Views[Dashboard / Appointments / Calendar / Schedules]
    Views --> State[Shared appointment state]
    State --> LocalStorage[(Browser LocalStorage)]
    State --> API[Frontend API service]
    API --> FastAPI[FastAPI application]
    FastAPI --> Routes[Appointment routes]
    Routes --> Services[Appointment service layer]
    Services --> Schemas[Pydantic schemas]
    Services --> Models[SQLAlchemy models]
    Models --> PostgreSQL[(PostgreSQL)]
    FastAPI --> CORS[CORS middleware]
```

### Backend request flow

1. React sends requests through `frontend/src/services/api.ts`.
2. FastAPI routes validate request and response data with Pydantic schemas.
3. The service layer applies business rules, including time-range validation and conflict detection.
4. SQLAlchemy reads and writes appointment records in PostgreSQL.
5. The response updates shared frontend state and browser-persisted state.

### Main directories

```text
appointment-board/
├── backend/
│   ├── app/
│   │   ├── routes/          # HTTP endpoints
│   │   ├── services/        # Business logic and conflict detection
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── database.py      # Engine, session, and Base setup
│   │   ├── main.py          # FastAPI app, CORS, startup, and health routes
│   │   └── seed_data.py     # Demo appointment seed data
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── ChronoApp.tsx    # Application shell, views, and shared state
│   │   ├── services/api.ts   # Backend API client
│   │   ├── types/            # Shared TypeScript types
│   │   ├── components/       # Reusable form and UI components
│   │   └── index.css         # Responsive application styling
│   ├── .env
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer
- A PostgreSQL database, for example `appointment_board`

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd appointment-board
```

### 2. Configure PostgreSQL

Create a database in PostgreSQL or pgAdmin. Then create `backend/.env` from the example file:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/appointment_board
```

Do not commit `.env` files or database credentials.

### 3. Start the backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The backend will be available at:

- API: `http://localhost:8001`
- Swagger UI: `http://localhost:8001/docs`
- Health check: `http://localhost:8001/health`

### 4. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
```

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:8001
```

Start Vite:

```powershell
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Frontend Commands

From `frontend/`:

```bash
npm run dev       # Start development server
npm run build     # Type-check and create production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

## API Endpoints

| Method  | Endpoint                      | Purpose                                             |
| ------- | ----------------------------- | --------------------------------------------------- |
| `GET`   | `/appointments`               | List appointments with optional date/status filters |
| `GET`   | `/appointments/{id}`          | Get one appointment                                 |
| `POST`  | `/appointments`               | Create an appointment                               |
| `PUT`   | `/appointments/{id}`          | Update an appointment                               |
| `PATCH` | `/appointments/{id}/complete` | Mark an appointment completed                       |
| `PATCH` | `/appointments/{id}/cancel`   | Cancel an appointment                               |
| `GET`   | `/health`                     | Check API health                                    |

## Production Deployment

A simple deployment uses a managed PostgreSQL provider, Render for the FastAPI API, and Vercel for the Vite frontend.

### Backend on Render

Create a Render Web Service with:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variable: `DATABASE_URL=<production-postgresql-url>`

After deployment, copy the API URL, for example:

```text
https://chrono-api.onrender.com
```

Add the deployed frontend domain to `allow_origins` in `backend/app/main.py`, then redeploy the API.

### Frontend on Vercel

Create a Vercel project with:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://chrono-api.onrender.com`

Never use `localhost` as `VITE_API_URL` in production.

## Screenshots

The application includes dashboard, appointment list, schedule, calendar, and mobile views.

### Dashboard

![CHRONO dashboard](docs/screenshots/dashboard.png)

### All Appointments

![CHRONO appointments](docs/screenshots/allappoinmens.png)

### Schedule Settings

![CHRONO schedules](docs/screenshots/Schedules.png)

### Calendar

![CHRONO calendar](docs/screenshots/Calender.png)

### Mobile Dashboard

![CHRONO mobile dashboard](docs/screenshots/mobile%20screen.png)

## Environment Variables

### Backend

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Frontend

```env
VITE_API_URL=http://localhost:8001
```

## Notes

- Tables are created during FastAPI startup through SQLAlchemy metadata.
- Demo appointments are seeded when the appointment table is empty.
- The frontend stores appointment and schedule state in browser LocalStorage.
- Backend conflict detection remains the source of truth when the API is available.
- For production, use a managed PostgreSQL database and configure CORS for the deployed frontend domain only.
