# E-Rakshan + SAI — Final Demo Run Guide

## Prerequisites

- Docker Desktop (for the Django/PostGIS backend)
- Node.js 18+
- Python 3.10+ (only needed for SAI voice)
- Chrome or Edge

## 1. Start the backend

Open PowerShell in `E-Rakshan-backend`:

```powershell
docker compose up --build
```

Wait until Django is serving on `http://127.0.0.1:8000`.

Seed the bundled Raigad/Wayanad data from a second terminal:

```powershell
docker compose exec backend python manage.py import_demo_geojson --district raigad --frontend /e-rakshan-frontend
docker compose exec backend python manage.py import_demo_geojson --district wayanad --frontend /e-rakshan-frontend
```

Optional recalculation:

```powershell
docker compose exec backend python manage.py score_sites
docker compose exec backend python manage.py risk_recalculate
docker compose exec backend python manage.py rebuild_road_connectivity
docker compose exec backend python manage.py generate_red_zones
```

## 2. Start the frontend

In `E-Rakshan-frontend`:

```powershell
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

Live Django mode is the default:

```env
VITE_DEMO_MODE=false
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

If you deliberately want the standalone demo without Django, set `VITE_DEMO_MODE=true`.

## 3. Login

Use the seeded/demo accounts supplied by the project when available:

- `commander@erakshan.in` / `demo123`
- `field@erakshan.in` / `demo123`
- `analyst@erakshan.in` / `demo123`

## 4. SAI voice

From `E-Rakshan-frontend/backend`, run:

```powershell
start_sai_voice.bat
```

The voice bridge listens on `ws://127.0.0.1:8787/ws`. The browser can also use device GPS for SAI location commands.

The microphone device index is machine-specific; if voice input fails on a different laptop, adjust `backend/voice/input.py`.

## 5. Optional Ollama

Ollama is only the general/open-ended fallback. Operational SAI commands use the Django backend. Install Ollama and a model only if you want local LLM answers.

## Important

- Do not commit real `.env` files, API keys, passwords or tokens.
- Government/API Setu/DAMINI/IMD integrations require legitimate credentials and provider contracts; none are fabricated or bundled.
- Demo/simulated data remains distinguishable from external observations.
