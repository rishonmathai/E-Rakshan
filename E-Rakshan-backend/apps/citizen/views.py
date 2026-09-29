import json
import urllib.parse
import urllib.request

from django.contrib.gis.geos import Point
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.alerts.models import Alert
from apps.hazards.models import HazardEvent, RedZone
from apps.shelters.models import Shelter
from apps.infrastructure.models import Road
from apps.incidents.models import Incident
from apps.districts.models import District

from .serializers import (
    CitizenAlertSerializer,
    CitizenHazardSerializer,
    CitizenIncidentSerializer,
    CitizenRedZoneSerializer,
    CitizenRoadSerializer,
    CitizenShelterSerializer,
)


class CitizenRedZoneListView(generics.ListAPIView):
    queryset = RedZone.objects.filter(active=True).order_by("name")
    serializer_class = CitizenRedZoneSerializer
    permission_classes = [AllowAny]


class CitizenShelterListView(generics.ListAPIView):
    queryset = Shelter.objects.filter(operational=True).order_by("name")
    serializer_class = CitizenShelterSerializer
    permission_classes = [AllowAny]


class CitizenRoadListView(generics.ListAPIView):
    queryset = Road.objects.all().order_by("name")
    serializer_class = CitizenRoadSerializer
    permission_classes = [AllowAny]


class CitizenIncidentListView(generics.ListAPIView):
    queryset = Incident.objects.all().order_by("-updated_at")
    serializer_class = CitizenIncidentSerializer
    permission_classes = [AllowAny]


class CitizenHazardListView(generics.ListAPIView):
    queryset = HazardEvent.objects.all().order_by("-observed_at")
    serializer_class = CitizenHazardSerializer
    permission_classes = [AllowAny]


class CitizenAlertListView(generics.ListAPIView):
    queryset = Alert.objects.all().order_by("-issued_at")
    serializer_class = CitizenAlertSerializer
    permission_classes = [AllowAny]


from pathlib import Path

class CitizenOfflineRoadPackView(APIView):
    """
    Serve the prepared Karjat offline road pack.

    The pack is generated once while online and stored with the backend.
    The Citizen App can cache it for true offline navigation.
    """

    permission_classes = [AllowAny]

    LAT = 18.910974
    LNG = 73.326958
    RADIUS_METERS = 1000

    def get(self, request):
        pack_path = (
            Path(__file__).resolve().parent
            / "data"
            / "offline"
            / "karjat_roads.json"
        )

        try:
            with pack_path.open("r", encoding="utf-8") as file:
                pack = json.load(file)
        except FileNotFoundError:
            return Response(
                {
                    "ok": False,
                    "error": "Prepared Karjat offline road pack is missing.",
                },
                status=404,
            )
        except json.JSONDecodeError as exc:
            return Response(
                {
                    "ok": False,
                    "error": "Prepared Karjat offline road pack is invalid.",
                    "detail": str(exc),
                },
                status=500,
            )

        return Response(
            {
                "ok": True,
                "mode": "prepared",
                "provider": pack.get("provider", "OSRM/OpenStreetMap"),
                "center": pack.get(
                    "center",
                    {
                        "lat": self.LAT,
                        "lng": self.LNG,
                    },
                ),
                "radiusMeters": pack.get(
                    "radiusMeters",
                    self.RADIUS_METERS,
                ),
                "points": pack.get("points", []),
                "routes": pack.get("routes", []),
                "routeCount": len(pack.get("routes", [])),
                "preparedAt": pack.get("preparedAt"),
            }
        )
class CitizenSyncView(APIView):
    """
    Return the current Citizen-safe OSIRIS snapshot.

    This is a full snapshot sync rather than an incremental event
    synchronization system. The frontend stores the returned datasets
    locally for offline use.
    """

    permission_classes = [AllowAny]

    def get_server_version(self):
        timestamps = []

        latest_alert = Alert.objects.order_by("-issued_at").values_list(
            "issued_at", flat=True
        ).first()
        if latest_alert:
            timestamps.append(latest_alert)

        latest_shelter = Shelter.objects.order_by("-updated_at").values_list(
            "updated_at", flat=True
        ).first()
        if latest_shelter:
            timestamps.append(latest_shelter)

        latest_incident = Incident.objects.order_by("-updated_at").values_list(
            "updated_at", flat=True
        ).first()
        if latest_incident:
            timestamps.append(latest_incident)

        latest_hazard = HazardEvent.objects.order_by("-observed_at").values_list(
            "observed_at", flat=True
        ).first()
        if latest_hazard:
            timestamps.append(latest_hazard)

        if not timestamps:
            return 0

        latest = max(timestamps)
        return int(latest.timestamp() * 1000)

    def post(self, request):
        local_version = request.data.get("localVersion", 0)

        try:
            local_version = int(local_version)
        except (TypeError, ValueError):
            local_version = 0

        server_version = self.get_server_version()

        changed = {
            "alerts": CitizenAlertSerializer(
                Alert.objects.all().order_by("-issued_at"),
                many=True,
            ).data,
            "shelters": CitizenShelterSerializer(
                Shelter.objects.filter(operational=True).order_by("name"),
                many=True,
            ).data,
            "mapPoints": {
                "redZones": CitizenRedZoneSerializer(
                    RedZone.objects.filter(active=True).order_by("name"),
                    many=True,
                ).data,
                "hazards": CitizenHazardSerializer(
                    HazardEvent.objects.all().order_by("-observed_at"),
                    many=True,
                ).data,
                "roads": CitizenRoadSerializer(
                    Road.objects.all().order_by("name"),
                    many=True,
                ).data,
                "incidents": CitizenIncidentSerializer(
                    Incident.objects.all().order_by("-updated_at"),
                    many=True,
                ).data,
            },
        }

        return Response(
            {
                "ok": True,
                "mode": "live",
                "serverVersion": server_version,
                "previousLocalVersion": local_version,
                "changed": changed,
                "syncedAt": timezone.now().isoformat(),
            }
        )


class CitizenSOSView(APIView):
    permission_classes = [AllowAny]

    OPERATING_DISTRICT_ID = 1

    def post(self, request):
        payload = request.data
        location = payload.get("location") or {}
        lat = location.get("lat")
        lng = location.get("lng")

        if lat is None or lng is None:
            return Response(
                {"ok": False, "error": "GPS coordinates are required."},
                status=400,
            )

        try:
            lat = float(lat)
            lng = float(lng)
        except (TypeError, ValueError):
            return Response(
                {"ok": False, "error": "Invalid GPS coordinates."},
                status=400,
            )

        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return Response(
                {"ok": False, "error": "GPS coordinates are out of range."},
                status=400,
            )

        district = District.objects.filter(
            pk=self.OPERATING_DISTRICT_ID,
            active=True,
        ).first()

        if not district:
            return Response(
                {"ok": False, "error": "Citizen operating district is unavailable."},
                status=503,
            )

        user = payload.get("user") or {}
        description = (
            "Emergency SOS reported from the E-Rakshan Citizen App. "
            f"Citizen: {user.get('name') or 'Unknown'}. "
            f"Phone: {user.get('phone') or 'Not provided'}."
        )

        incident = Incident.objects.create(
            id=f"SOS-{timezone.now().strftime('%Y%m%d%H%M%S%f')}",
            district=district,
            incident_type="Emergency SOS",
            severity="critical",
            status="unverified",
            location=Point(lng, lat, srid=4326),
            location_name=user.get("address") or "",
            description=description,
            source="citizen",
            confidence=0.8,
        )

        return Response(
            {
                "ok": True,
                "mode": "live",
                "dispatchId": incident.id,
                "incidentId": incident.id,
                "status": incident.status,
                "district": {
                    "id": district.id,
                    "name": district.name,
                    "state": district.state,
                },
                "receivedAt": incident.reported_at.isoformat(),
            },
            status=201,
        )


class CitizenSOSLocationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, session_id):
        location = request.data.get("location") or {}
        lat = location.get("lat")
        lng = location.get("lng")

        if lat is None or lng is None:
            return Response(
                {"ok": False, "error": "GPS coordinates are required."},
                status=400,
            )

        try:
            lat = float(lat)
            lng = float(lng)
        except (TypeError, ValueError):
            return Response(
                {"ok": False, "error": "Invalid GPS coordinates."},
                status=400,
            )

        incident = Incident.objects.filter(
            pk=session_id,
            source="citizen",
            incident_type="Emergency SOS",
        ).first()

        if not incident:
            return Response(
                {"ok": False, "error": "SOS session not found."},
                status=404,
            )

        incident.location = Point(lng, lat, srid=4326)
        incident.save(update_fields=["location", "updated_at"])

        return Response(
            {
                "ok": True,
                "sessionId": incident.id,
                "updatedAt": incident.updated_at.isoformat(),
            }
        )
