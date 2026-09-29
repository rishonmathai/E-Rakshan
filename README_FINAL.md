# E-Rakshan — Final Integrated Demo Package

This package contains the current integrated E-Rakshan backend, frontend and SAI voice bridge.

## Architecture

External sources → OSIRIS → PostgreSQL/PostGIS → Hazard/Risk → Red Zones → Safe Sites → Roads/Routes → Relocation → Alerts/Reports → SAI

## Quick start

1. Install Docker Desktop and Node.js 18+.
2. Extract this package.
3. Open `E-Rakshan-backend` and run `docker compose up --build`.
4. Seed Raigad/Wayanad data using the commands in `E-Rakshan-frontend/HOW_TO_RUN.md`.
5. Open `E-Rakshan-frontend`, run `npm install`, then `npm run dev`.
6. Open the Vite URL and log in.
7. Start `E-Rakshan-frontend/backend/start_sai_voice.bat` if voice SAI is required.

The frontend defaults to live Django mode; standalone demo mode remains available through `VITE_DEMO_MODE=true`.

## Included

- Django REST + PostGIS backend
- Celery + Redis scheduling
- GIS layers and demo geography
- Hazard/risk/red-zone pipeline
- Safe-site scoring
- Road connectivity and route assessment
- Backend relocation optimization
- OSIRIS provenance/normalization layer
- GDACS/OpenWeather/OSM integration scaffolding
- Configurable API Setu/DAMINI/IMD integration points
- React/Vite operational UI
- SAI operational command path and Ollama fallback
- Browser GPS support
- SAI local voice bridge

## Credentials and external APIs

No real secrets are bundled. Put approved credentials in environment variables. Protected government integrations such as API Setu/DAMINI/IMD must be configured with legitimate provider access.

## Validation

All Python source files in the packaged backend and SAI voice bridge compile successfully. Docker Compose YAML parses successfully. The React production build still needs to be run on a machine with npm dependencies installed.
