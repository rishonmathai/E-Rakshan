from rest_framework import generics
from .models import Road
from .serializers import RoadSerializer
class RoadListView(generics.ListAPIView):
    serializer_class=RoadSerializer
    def get_queryset(self):
        qs=Road.objects.all()
        d=self.request.query_params.get("district")
        status=self.request.query_params.get("status")
        if d: qs=qs.filter(district_id=d)
        if status: qs=qs.filter(status=status)
        return qs
