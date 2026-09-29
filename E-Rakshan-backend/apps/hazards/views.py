from rest_framework import generics
from .models import HazardEvent, RedZone
from .serializers import HazardEventSerializer, RedZoneSerializer
class HazardEventListView(generics.ListCreateAPIView):
    serializer_class=HazardEventSerializer
    queryset=HazardEvent.objects.all().order_by("-observed_at")
class RedZoneListView(generics.ListCreateAPIView):
    serializer_class=RedZoneSerializer
    queryset=RedZone.objects.all().order_by("-current_severity")
