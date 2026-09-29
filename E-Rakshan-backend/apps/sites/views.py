from rest_framework import generics
from .models import RelocationSite
from .serializers import RelocationSiteSerializer
class SiteListView(generics.ListAPIView):
    serializer_class=RelocationSiteSerializer
    def get_queryset(self):
        qs=RelocationSite.objects.all()
        d=self.request.query_params.get("district")
        a=self.request.query_params.get("amenity")
        t=self.request.query_params.get("type")
        if d: qs=qs.filter(district_id=d)
        if t: qs=qs.filter(type__icontains=t)
        if a: qs=qs.filter(amenities__icontains=a)
        return qs.order_by("-overall_suitability")
