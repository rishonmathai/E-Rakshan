from rest_framework import serializers
from .models import OsirisRecord

class OsirisRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsirisRecord
        fields = "__all__"
