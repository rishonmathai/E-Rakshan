from rest_framework import generics
from rest_framework.response import Response
from .models import Alert
from .serializers import AlertSerializer
class AlertListView(generics.ListAPIView):
    serializer_class=AlertSerializer
    def get_queryset(self):
        qs=Alert.objects.all().order_by("-issued_at")
        d=self.request.query_params.get("district"); s=self.request.query_params.get("status")
        if d: qs=qs.filter(district_id=d)
        if s: qs=qs.filter(status=s)
        return qs
class AlertDetailView(generics.RetrieveUpdateAPIView):
    queryset=Alert.objects.all(); serializer_class=AlertSerializer
