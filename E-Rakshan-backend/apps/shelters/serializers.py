from rest_framework import serializers
from .models import Shelter
class ShelterSerializer(serializers.ModelSerializer):
    free_capacity=serializers.IntegerField(read_only=True)
    class Meta: model=Shelter; fields="__all__"
