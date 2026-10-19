# Pursuit — Job application tracker

Track job applications, move them through stages, and get in-app reminders to follow up.

- **Google sign-in.** Google Identity Services issues an ID token, the backend verifies it and sets an httpOnly JWT cookie.
- **Log application.** Add the company, role, date applied and the first reminder. The reminder counts from the day you add the application (3 / 5 / 7 / 15 days, a custom number of days, or an exact date).
- **Pipeline.** A table sorted by the next reminder. Change the stage inline. Every stage except Applied and Rejected asks for a date (OA, interview, deadline…) and moves the reminder to that date.
- **Reminders.** One in-app digest per day lists every application due, based on each user's own timezone. After a reminder, you can schedule the next check-in. Rejected applications get no more reminders.
- **Profile.** Totals, response and offer rates, applications per week, stage breakdown and upcoming events.
- **Company logos.** Each logo is fetched once per domain from logo.dev (falling back to Google favicons) and stored in Postgres. The app serves logos from its own endpoint. You can keep the fetched logo, replace it with an image URL, or remove it.

## Stack

| | |
|---|---|
| Frontend | React + TypeScript (Vite), Tailwind CSS v4, React Router, TanStack Query & Table, zustand, react-hook-form + zod, Radix UI, Recharts, sonner |
| Backend | FastAPI, SQLAlchemy 2 (async, asyncpg), Alembic, pydantic-settings, google-auth, PyJWT, APScheduler, httpx |
| Database | PostgreSQL |

## Project layout

```
backend/
  app/
    api/v1/      # routers: auth, applications, notifications, stats, logos
    core/        # settings, JWT + Google token verification, dependencies
    db/          # declarative base, async session
    models/      # SQLAlchemy models
    schemas/     # pydantic request/response models
    services/    # reminder rules, notification digests, logo cache, stats
    jobs/        # APScheduler reminder-digest job
  alembic/       # migrations
  tests/
frontend/
  src/
    api/         # React Query hooks per resource
    components/  # ui/ primitives, layout/, applications/, stats/
    lib/         # axios client, query client, constants, helpers
    pages/       # Login, Log application, Pipeline, Profile
    stores/      # zustand: auth, theme, pipeline UI
    styles/      # globals.css — all design tokens (light + dark)
```

## Setup

### 1. Google OAuth client

1. In Google Cloud Console, open **APIs & Services → Credentials → Create credentials → OAuth client ID** and choose **Web application**.
2. Under **Authorized JavaScript origins**, add `http://localhost:5173` (plus your production origin later). No redirect URI is needed.
3. Use the client ID as both `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend).

### 2. Backend

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/).

```bash
cd backend
cp .env.example .env        # set DATABASE_URL, GOOGLE_CLIENT_ID, JWT_SECRET, logo.dev keys
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

`DATABASE_URL` can be a plain `postgres://` / `postgresql://` URL. It's switched to the asyncpg driver automatically, and `sslmode=require` is translated for hosted providers such as Neon.

API docs: http://localhost:8000/docs

### 3. Frontend

Requires Node 20+.

```bash
cd frontend
cp .env.example .env        # set VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite proxies `/api` to the backend, so the session cookie is same-origin.

## Checks

```bash
cd backend && uv run pytest && uv run ruff check .
cd frontend && npm run lint && npm run build
```

## How reminders work

| Event | Next reminder |
|---|---|
| Application added | today + chosen days, or a custom date |
| Stage → OA cleared / assignment / hackathon / round 1 / round 2 / interview / offer / custom | the event date you enter |
| Stage → Applied | unchanged (7 days from today if it had none) |
| Stage → Rejected | none |
| "Set next" / "Snooze" | today + 3 / 5 / 7 / 15 days, or a custom date |

"Today" is worked out in each user's timezone, which the browser reports at sign-in. A background job runs hourly to create digests, and they're also created the first time notifications are fetched each day, so they appear even if the server was down.
