import json, re
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import GEOSGeometry, Point
from apps.districts.models import District
from apps.habitations.models import Habitation
from apps.hazards.models import RedZone
from apps.shelters.models import Shelter
from apps.sites.models import RelocationSite
from apps.infrastructure.models import Road
from apps.incidents.models import Incident


class Command(BaseCommand):
    help = "Import E-Rakshan frontend demo GeoJSON into PostGIS"

    def add_arguments(self, parser):
        parser.add_argument(
            "--district",
            required=True,
            choices=["raigad", "wayanad"]
        )
        parser.add_argument("--frontend", default=None)

    def handle(self, *args, **opts):
        name = opts["district"]

        frontend = (
            Path(opts["frontend"])
            if opts["frontend"]
            else Path(__file__).resolve().parents[5].parent / "e-rakshan-frontend"
        )

        base = frontend / "public" / "demo-data" / name

        state = "Maharashtra" if name == "raigad" else "Kerala"

        district, _ = District.objects.get_or_create(
            name=name.title(),
            state=state,
            defaults={"default_zoom": 10}
        )

        files = {
            "habitations": Habitation,
            "redzones": RedZone,
            "safe-sites": RelocationSite,
            "shelters": Shelter,
            "roads": Road,
            "incidents": Incident,
        }

        for folder, model in files.items():
            path = base / f"{folder}.geojson"

            if not path.exists():
                self.stdout.write(
                    self.style.WARNING(f"Missing {path}; skipped.")
                )
                continue

            for fp in [path]:
                data = json.loads(
                    fp.read_text(encoding="utf-8")
                )

                for idx, feature in enumerate(
                    data.get("features", []),
                    1
                ):
                    p = feature.get("properties") or {}
                    geom = feature.get("geometry")

                    if not geom:
                        continue

                    g = GEOSGeometry(
                        json.dumps(geom),
                        srid=4326
                    )

                    obj_id = (
                        f"{name[:2].upper()}-"
                        f"{str(p.get('id') or f'{folder[:3].upper()}-{idx:02d}')}"
                    )

                    # ---------------------------------------------------------
                    # HABITATIONS
                    # ---------------------------------------------------------
                    if model is Habitation:
                        if g.geom_type != "Point":
                            continue

                        # Preserve any existing analysis information.
                        existing = model.objects.filter(
                            id=obj_id
                        ).first()

                        analysis = (
                            dict(existing.analysis or {})
                            if existing
                            else {}
                        )

                        # Import rainfall from GeoJSON into the field
                        # expected by the intelligence service.
                        analysis["rainfall"] = float(
                            p.get("rainfall24_mm", 0) or 0
                        )

                        # Preserve event exposure as additional analysis data.
                        analysis["event_exposure"] = float(
                            p.get("event_exposure", 0) or 0
                        )

                        obj, _ = model.objects.update_or_create(
                            id=obj_id,
                            defaults={
                                "district": district,
                                "name": p.get("name", obj_id),
                                "panchayath": p.get("panchayath", ""),
                                "location": g,

                                "population": int(
                                    p.get(
                                        "population",
                                        p.get("pop", 0)
                                    ) or 0
                                ),

                                "households": int(
                                    p.get("households", 0) or 0
                                ),

                                # Vulnerability inputs
                                "elderly_pct": float(
                                    p.get("elderly_pct", 0) or 0
                                ),

                                "children_pct": float(
                                    p.get("children_pct", 0) or 0
                                ),

                                "disabled_pct": float(
                                    p.get("disabled_pct", 0) or 0
                                ),

                                "fragile_housing_pct": float(
                                    p.get("fragile_housing_pct", 0) or 0
                                ),

                                "no_vehicle_pct": float(
                                    p.get("no_vehicle_pct", 0) or 0
                                ),

                                "dist_hospital_km": float(
                                    p.get("dist_hospital_km", 0) or 0
                                ),

                                # Hazard inputs
                                "elevation_m": float(
                                    p.get(
                                        "elevation_m",
                                        p.get("elevation", 0)
                                    ) or 0
                                ),

                                "slope_deg": float(
                                    p.get(
                                        "slope_deg",
                                        p.get("slope", 0)
                                    ) or 0
                                ),

                                "dist_river_km": float(
                                    p.get(
                                        "dist_river_km",
                                        p.get("dist_river", 99)
                                    ) or 99
                                ),

                                "drainage_index": float(
                                    p.get("drainage_index", 0) or 0
                                ),

                                "hist_events": int(
                                    p.get(
                                        "hist_events",
                                        p.get("historical", 0)
                                    ) or 0
                                ),

                                # Stores rainfall and other analysis data.
                                "analysis": analysis,
                            }
                        )

                    # ---------------------------------------------------------
                    # SHELTERS
                    # ---------------------------------------------------------
                    elif model is Shelter:
                        if g.geom_type != "Point":
                            continue

                        model.objects.update_or_create(
                            id=obj_id,
                            defaults={
                                "district": district,
                                "name": p.get("name", obj_id),
                                "type": p.get("type", ""),
                                "location": g,
                                "capacity": int(
                                    p.get("capacity", 0) or 0
                                ),
                                "current_occupancy": int(
                                    p.get(
                                        "current_occupancy",
                                        p.get("occupancy", 0)
                                    ) or 0
                                ),
                                "medical_support": bool(
                                    p.get(
                                        "medical_support",
                                        p.get("medical", False)
                                    )
                                ),
                                "operational": bool(
                                    p.get("operational", True)
                                ),
                            }
                        )

                    # ---------------------------------------------------------
                    # RELOCATION SITES
                    # ---------------------------------------------------------
                    elif model is RelocationSite:
                        model.objects.update_or_create(
                            id=obj_id,
                            defaults={
                                "district": district,
                                "name": p.get("name", obj_id),
                                "type": p.get("type", ""),
                                "location": g,
                                "area_ha": float(
                                    p.get("area_ha", 0) or 0
                                ),
                                "hazard_safety_score": float(
                                    p.get("hazard_safety", 0) or 0
                                ),
                                "capacity_score": float(
                                    p.get("capacity_score", 0) or 0
                                ),
                                "connectivity_score": float(
                                    p.get("connectivity", 0) or 0
                                ),
                                "terrain_score": float(
                                    p.get("terrain", 0) or 0
                                ),
                                "livelihood_score": float(
                                    p.get("livelihood", 0) or 0
                                ),
                                "services_score": float(
                                    p.get("services", 0) or 0
                                ),
                                "overall_suitability": float(
                                    p.get("suitability", 0) or 0
                                ),
                                "amenities": (
                                    p.get("amenities", [])
                                    if isinstance(
                                        p.get("amenities", []),
                                        list
                                    )
                                    else []
                                ),
                            }
                        )

                    # ---------------------------------------------------------
                    # ROADS
                    # ---------------------------------------------------------
                    elif model is Road:
                        if g.geom_type != "LineString":
                            continue

                        road_status = p.get("status", "open")

                        # Normalize frontend "partial" status to the
                        # backend Road model's "caution" status.
                        if road_status == "partial":
                            road_status = "caution"
                        elif road_status not in {"open", "blocked", "caution"}:
                            road_status = "open"

                        model.objects.update_or_create(
                            id=obj_id,
                            defaults={
                                "district": district,
                                "name": p.get("name", obj_id),
                                "road_class": p.get(
                                    "road_class",
                                    p.get("class", "")
                                ),
                                "path": g,
                                "status": road_status,
                                "flood_depth_cm": float(
                                    p.get("flood_depth_cm", 0) or 0
                                ),
                                "surface": p.get("surface", ""),
                                "connects_habitations": p.get(
                                    "connects",
                                    []
                                ) or [],
                            }
                        )

                    # ---------------------------------------------------------
                    # RED ZONES
                    # ---------------------------------------------------------
                    elif model is RedZone:
                        if g.geom_type != "Polygon":
                            continue

                        model.objects.update_or_create(
                            id=obj_id,
                            defaults={
                                "district": district,
                                "name": p.get("name", obj_id),
                                "hazard_type": p.get(
                                    "hazard_type",
                                    p.get("type", "unknown")
                                ),
                                "boundary": g,
                                "base_severity": float(
                                    p.get("base_severity", 0) or 0
                                ),
                                "current_severity": float(
                                    p.get(
                                        "current_severity",
                                        p.get("severity", 0)
                                    ) or 0
                                ),
                                "probability": float(
                                    p.get("probability", 0) or 0
                                ),
                                "population_exposed": int(
                                    p.get("population_exposed", 0) or 0
                                ),
                            }
                        )

                    # ---------------------------------------------------------
                    # INCIDENTS
                    # ---------------------------------------------------------
                    elif model is Incident:
                        if g.geom_type != "Point":
                            continue

                        model.objects.update_or_create(
                            id=obj_id,
                            defaults={
                                "district": district,
                                "incident_type": p.get(
                                    "incident_type",
                                    p.get("type", "unknown")
                                ),
                                "severity": p.get(
                                    "severity",
                                    "medium"
                                ),
                                "status": p.get(
                                    "status",
                                    "unverified"
                                ),
                                "location": g,
                                "location_name": p.get(
                                    "location_name",
                                    p.get("name", "")
                                ),
                                "description": p.get(
                                    "description",
                                    ""
                                ),
                                "source": p.get(
                                    "source",
                                    "demo"
                                ),
                                "confidence": float(
                                    p.get("confidence", 0.5) or 0.5
                                ),
                                "authority_confirmed": bool(
                                    p.get(
                                        "authority_confirmed",
                                        False
                                    )
                                ),
                            }
                        )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Imported {folder} for {district.name}"
                )
            )