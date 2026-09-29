from django.contrib.gis.db import models
from apps.districts.models import District
class RelocationSite(models.Model):
    id=models.CharField(max_length=40,primary_key=True)
    district=models.ForeignKey(District,on_delete=models.CASCADE,related_name="sites")
    name=models.CharField(max_length=180)
    type=models.CharField(max_length=100,blank=True)
    location=models.GeometryField(srid=4326)
    area_ha=models.FloatField(default=0)
    hazard_safety_score=models.FloatField(default=0)
    capacity_score=models.FloatField(default=0)
    connectivity_score=models.FloatField(default=0)
    terrain_score=models.FloatField(default=0)
    livelihood_score=models.FloatField(default=0)
    services_score=models.FloatField(default=0)
    overall_suitability=models.FloatField(default=0)
    amenities=models.JSONField(default=dict,blank=True)
