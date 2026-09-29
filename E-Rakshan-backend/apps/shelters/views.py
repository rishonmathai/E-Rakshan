from rest_framework import generics, status
from rest_framework.response import Response
from .models import Shelter
from .serializers import ShelterSerializer
class ShelterListView(generics.ListAPIView):
    serializer_class=ShelterSerializer
    def get_queryset(self):
        qs=Shelter.objects.all()
        d=self.request.query_params.get("district")
        if d: qs=qs.filter(district_id=d)
        return qs
class ShelterOccupancyView(generics.UpdateAPIView):
    queryset=Shelter.objects.all(); serializer_class=ShelterSerializer
    def patch(self,request,*args,**kwargs):
        s=self.get_object(); occ=int(request.data.get("occupancy",s.current_occupancy))
        if occ<0 or occ>s.capacity: return Response({"error":"Occupancy must be between 0 and capacity."},status=400)
        s.current_occupancy=occ; s.save(); return Response(self.get_serializer(s).data)
class ShelterOperationalView(generics.UpdateAPIView):
    queryset=Shelter.objects.all(); serializer_class=ShelterSerializer
    def patch(self,request,*args,**kwargs):
        s=self.get_object(); s.operational=bool(request.data.get("operational",s.operational)); s.save(); return Response(self.get_serializer(s).data)
