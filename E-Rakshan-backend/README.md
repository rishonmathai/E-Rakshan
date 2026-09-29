# E-Rakshan Backend

Django REST + PostgreSQL/PostGIS backend for E-Rakshan.

## Recommended Windows run

1. Install Docker Desktop.
2. Keep `E-Rakshan-backend` and `E-Rakshan-frontend` as sibling folders.
3. From this folder run:

```powershell
docker compose up --build
```

The stack starts PostgreSQL/PostGIS, Redis, Django, Celery and Celery Beat.

Backend: `http://127.0.0.1:8000`
Swagger: `http://127.0.0.1:8000/api/docs/`
Admin: `http://127.0.0.1:8000/admin/`

### Seed the bundled demo geography

After the backend is running:

```powershell
docker compose exec backend python manage.py import_demo_geojson --district raigad --frontend /e-rakshan-frontend
docker compose exec backend python manage.py import_demo_geojson --district wayanad --frontend /e-rakshan-frontend
```

Then optionally recalculate the analytical layers:

```powershell
docker compose exec backend python manage.py score_sites
docker compose exec backend python manage.py risk_recalculate
docker compose exec backend python manage.py rebuild_road_connectivity
docker compose exec backend python manage.py generate_red_zones
```

## Local Python mode

Docker is strongly recommended because GeoDjango/PostGIS requires native GIS dependencies. If PostgreSQL/PostGIS and Redis are already installed locally, create `.env`, install `requirements.txt`, run migrations, and use `python manage.py runserver`.

## Design rules

- Unverified citizen reports never automatically create official red zones.
- E-Rakshan recommends and explains; an officer remains the decision maker for consequential emergency actions.
- External credentials belong in environment variables and are never bundled.
- Simulated/demo data must remain clearly distinguishable from live observations.
