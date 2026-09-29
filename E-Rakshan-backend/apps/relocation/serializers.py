from rest_framework import serializers
from .models import RelocationPlan, RelocationAssignment
class RelocationAssignmentSerializer(serializers.ModelSerializer):
    class Meta: model=RelocationAssignment; fields="__all__"
class RelocationPlanSerializer(serializers.ModelSerializer):
    assignments=RelocationAssignmentSerializer(many=True,read_only=True)
    class Meta: model=RelocationPlan; fields="__all__"
