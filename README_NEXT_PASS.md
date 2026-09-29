# E-Rakshan - Integrated Development Package

This package is the current integrated development build for E-Rakshan.

## Architecture

External data -> OSIRIS -> PostGIS -> Hazard/Risk -> Red Zones -> Safe Sites -> Roads/Routes -> Relocation -> Alerts -> SAI.

## Backend

1. Install Docker Desktop.
2. Open PowerShell in `E-Rakshan-backend`.
3. Optional: copy `.env.example` to `.env` for custom credentials/settings. Local Docker defaults are provided.
4. Run:

   `docker compose up --build`

5. Backend: `http://127.0.0.1:8000`
6. API docs: `http://127.0.0.1:8000/api/docs/`

Docker Compose starts PostgreSQL/PostGIS, Redis, Django, Celery worker and Celery Beat.

## Frontend + SAI

1. Open a second terminal in `E-Rakshan-frontend`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` if desired.
4. Run `npm run dev`.
5. Open the Vite URL.

Live Django mode is the default (`VITE_DEMO_MODE=false`). If the backend is unavailable, the current UI can fall back to the local demo dataset.

## SAI voice bridge

From `E-Rakshan-frontend/backend` run `start_sai_voice.bat` for the local voice bridge. `install_sai_autostart.bat` can be used for Windows login auto-start.

## Important

Do not commit real `.env` files, credentials, API keys, virtual environments, `node_modules`, build output or Python cache files.

Restricted government integrations such as API Setu/DAMINI/IMD must use legitimate provider credentials and endpoint contracts; no credentials are bundled with this package.

## Current integration work

- Backend-authoritative relocation solving in live mode.
- Browser live-data loader for Django GIS layers.
- OSIRIS provenance/normalization records.
- Safe-site scoring.
- Red-zone generation.
- Road/habitation connectivity infrastructure.
- GDACS/OpenWeather/OSM provider scaffolding.
- SAI -> Django operational architecture with Ollama fallback.
- JWT refresh handling in the frontend API client.
