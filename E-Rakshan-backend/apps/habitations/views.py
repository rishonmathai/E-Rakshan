from rest_framework import generics
from rest_framework.response import Response
from .models import Habitation
from .serializers import HabitationSerializer
from apps.intelligence.services import explain_habitation

class HabitationListView(generics.ListAPIView):
    serializer_class = HabitationSerializer
    def get_queryset(self):
        qs = Habitation.objects.all()
        district = self.request.query_params.get("district")
        band = self.request.query_params.get("band")
        q = self.request.query_params.get("search")
        if district: qs = qs.filter(district_id=district)
        if band == "critical": qs = qs.filter(priority_score__gte=.8)
        elif band == "high": qs = qs.filter(priority_score__gte=.6, priority_score__lt=.8)
        if q: qs = qs.filter(name__icontains=q)
        return qs.order_by("-priority_score")

class HabitationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Habitation.objects.all()
    serializer_class = HabitationSerializer

class HabitationExplainView(generics.RetrieveAPIView):
    queryset = Habitation.objects.all()
    def retrieve(self, request, *args, **kwargs):
        return Response(explain_habitation(self.get_object()))

class HabitationAccessibilityView(generics.RetrieveAPIView):
    queryset = Habitation.objects.all()
    def retrieve(self, request, *args, **kwargs):
        h = self.get_object()
        return Response({"habitation_id":h.id,"is_isolated":h.is_isolated,"message":"No safe land route" if h.is_isolated else "Land access available"})
