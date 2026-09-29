from rest_framework import serializers
from .models import Habitation
class HabitationSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()
    class Meta:
        model = Habitation
        fields = "__all__"
    def get_location(self, obj):
        return {"type":"Point","coordinates":[obj.location.x,obj.location.y]} if obj.location else None
