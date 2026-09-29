from django.contrib.gis.geos import GEOSGeometry
from django.db.models import Q
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import District
from .serializers import DistrictSerializer
from apps.habitations.models import Habitation
from apps.shelters.models import Shelter
from apps.hazards.models import RedZone, HazardEvent
from apps.infrastructure.models import Road
from apps.incidents.models import Incident
from apps.alerts.models import Alert
from apps.sites.models import RelocationSite

class DistrictListView(generics.ListCreateAPIView):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer

class DistrictDetailView(generics.RetrieveUpdateAPIView):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer

class DashboardSummaryView(APIView):
    def get(self, request):
        district_id = request.query_params.get("district")
        qs = Habitation.objects.filter(district_id=district_id) if district_id else Habitation.objects.all()
        shelters = Shelter.objects.filter(district_id=district_id) if district_id else Shelter.objects.all()
        return Response({
            "district": district_id,
            "kpis": {
                "pop_at_risk": sum(h.population for h in qs if (h.priority_score or 0) >= .5),
                "critical_count": qs.filter(priority_score__gte=.8).count(),
                "high_count": qs.filter(priority_score__gte=.6, priority_score__lt=.8).count(),
                "red_zones_active": RedZone.objects.filter(district_id=district_id, active=True).count() if district_id else RedZone.objects.filter(active=True).count(),
                "free_beds": sum(max(0, s.capacity - s.current_occupancy) for s in shelters),
                "isolated_count": qs.filter(is_isolated=True).count(),
                "active_incidents": Incident.objects.filter(district_id=district_id, status__in=["unverified","verified","responding"]).count() if district_id else Incident.objects.filter(status__in=["unverified","verified","responding"]).count(),
            },
            "top_risk": [
                {"id": h.id, "name": h.name, "priority_score": h.priority_score, "band": h.risk_band}
                for h in qs.order_by("-priority_score")[:10]
            ],
            "latest_alert": (Alert.objects.filter(district_id=district_id, status__in=["new","acknowledged"]).order_by("-issued_at").values("id","severity","message","source").first() if district_id else None),
        })

class GISLayersView(APIView):
    def get(self, request):
        district_id = request.query_params.get("district")
        from apps.habitations.serializers import HabitationSerializer
        from apps.shelters.serializers import ShelterSerializer
        from apps.sites.serializers import RelocationSiteSerializer
        from apps.infrastructure.serializers import RoadSerializer
        from apps.incidents.serializers import IncidentSerializer
        from apps.hazards.serializers import RedZoneSerializer
        return Response({
            "hazard_events": [
                {**__import__("apps.hazards.serializers", fromlist=["HazardEventSerializer"]).HazardEventSerializer(e).data, "geometry": __import__("json").loads(e.location.geojson) if e.location else None}
                for e in HazardEvent.objects.filter(district_id=district_id).order_by("-observed_at")[:500]
            ],
            "habitations": HabitationSerializer(Habitation.objects.filter(district_id=district_id), many=True).data,
            "redzones": RedZoneSerializer(RedZone.objects.filter(district_id=district_id, active=True), many=True).data,
            "shelters": ShelterSerializer(Shelter.objects.filter(district_id=district_id), many=True).data,
            "safe_sites": RelocationSiteSerializer(RelocationSite.objects.filter(district_id=district_id), many=True).data,
            "roads": RoadSerializer(Road.objects.filter(district_id=district_id), many=True).data,
            "incidents": IncidentSerializer(Incident.objects.filter(district_id=district_id), many=True).data,
        })

class SearchView(APIView):
    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if not q: return Response([])
        results = []
        for model, kind in [(Habitation,"habitation"),(Shelter,"shelter"),(RedZone,"red_zone"),(Road,"road")]:
            for obj in model.objects.filter(Q(name__icontains=q))[:10]:
                results.append({"type":kind,"id":obj.pk,"name":obj.name})
        return Response(results)
