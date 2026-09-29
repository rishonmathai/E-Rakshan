import json
from rest_framework import serializers
from .models import Incident
class IncidentSerializer(serializers.ModelSerializer):
    location=serializers.SerializerMethodField()
    class Meta: model=Incident; fields="__all__"
    def get_location(self,obj): return json.loads(obj.location.geojson) if obj.location else None
