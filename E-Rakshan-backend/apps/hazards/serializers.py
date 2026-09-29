from rest_framework import serializers
from .models import HazardEvent, RedZone
class HazardEventSerializer(serializers.ModelSerializer):
    class Meta: model=HazardEvent; fields="__all__"
class RedZoneSerializer(serializers.ModelSerializer):
    boundary = serializers.SerializerMethodField()
    class Meta: model=RedZone; fields="__all__"
    def get_boundary(self,obj):
        return json.loads(obj.boundary.geojson) if obj.boundary else None
import json
