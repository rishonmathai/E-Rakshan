import json
from rest_framework import serializers
from .models import RelocationSite
class RelocationSiteSerializer(serializers.ModelSerializer):
    location=serializers.SerializerMethodField()
    class Meta: model=RelocationSite; fields="__all__"
    def get_location(self,obj): return json.loads(obj.location.geojson) if obj.location else None
