from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json

from django.conf import settings
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OsirisRecord
from .serializers import OsirisRecordSerializer
from .services import normalize_record


class IngestionHealthView(APIView):
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "adapters": {
                    "weather": bool(
                        getattr(settings, "OPENWEATHER_API_KEY", "")
                    ),
                    "damini": bool(
                        getattr(settings, "DAMINI_BASE_URL", "")
                    ),
                    "gdacs": True,
                    "osm": bool(
                        getattr(settings, "OSM_OVERPASS_URL", "")
                    ),
                },
            }
        )


class WeatherView(APIView):
    def get(self, request):
        api_key = getattr(settings, "OPENWEATHER_API_KEY", "")
        base_url = getattr(
            settings,
            "OPENWEATHER_BASE_URL",
            "https://api.openweathermap.org/data/2.5",
        )

        if not api_key:
            return Response(
                {
                    "status": "unavailable",
                    "error": "OpenWeather API key is not configured.",
                },
                status=503,
            )

        try:
            lat = float(request.query_params.get("lat", 11.605))
            lon = float(request.query_params.get("lon", 76.083))

            params = urlencode(
                {
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "metric",
                }
            )

            request_url = f"{base_url}/weather?{params}"

            req = Request(
                request_url,
                headers={
                    "User-Agent": "E-Rakshan/1.0",
                },
            )

            with urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))

            weather = data.get("weather", [{}])[0]
            main = data.get("main", {})
            wind = data.get("wind", {})

            return Response(
                {
                    "status": "ok",
                    "source": "openweathermap",
                    "location": {
                        "name": data.get("name"),
                        "latitude": lat,
                        "longitude": lon,
                    },
                    "weather": {
                        "description": weather.get("description"),
                        "condition": weather.get("main"),
                        "temperature_c": main.get("temp"),
                        "feels_like_c": main.get("feels_like"),
                        "humidity_pct": main.get("humidity"),
                        "pressure_hpa": main.get("pressure"),
                        "wind_speed_mps": wind.get("speed"),
                    },
                    "observed_at": data.get("dt"),
                }
            )

        except Exception as exc:
            return Response(
                {
                    "status": "unavailable",
                    "source": "openweathermap",
                    "error": str(exc),
                },
                status=503,
            )


class DaminiLightningView(APIView):
    def get(self, request):
        base_url = getattr(settings, "DAMINI_BASE_URL", "")
        api_key = getattr(settings, "DAMINI_API_KEY", "")

        # DAMINI credentials are optional for the SIH demo.
        if not base_url or not api_key:
            return Response(
                {
                    "status": "demo",
                    "source": "damini",
                    "live": False,
                    "message": "DAMINI live credentials are not configured.",
                    "alerts": {
                        "red": "In lightning zone. Move to safer place",
                        "yellow": "Possibility of lightning be prepared",
                        "green": "No lightning warning",
                    },
                    "lightning": {
                        "5min": [],
                        "10min": [],
                        "15min": [],
                    },
                }
            )

        return Response(
            {
                "status": "unavailable",
                "source": "damini",
                "live": False,
                "message": "DAMINI live adapter is not enabled yet.",
            },
            status=503,
        )


class NormalizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(normalize_record(request.data))


class OsirisRecordListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OsirisRecordSerializer

    def get_queryset(self):
        qs = OsirisRecord.objects.all()

        source = self.request.query_params.get("source")
        district = self.request.query_params.get("district")

        if source:
            qs = qs.filter(source=source)

        if district:
            qs = qs.filter(district_id=district)

        return qs[:500]