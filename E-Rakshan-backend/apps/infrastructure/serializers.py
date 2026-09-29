import json
from rest_framework import serializers
from .models import Road
class RoadSerializer(serializers.ModelSerializer):
    path=serializers.SerializerMethodField()
    class Meta: model=Road; fields="__all__"
    def get_path(self,obj): return json.loads(obj.path.geojson) if obj.path else None
