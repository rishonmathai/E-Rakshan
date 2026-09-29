from django.contrib.gis.db import models
from apps.districts.models import District

class OsirisRecord(models.Model):
    source = models.CharField(max_length=120)
    external_id = models.CharField(max_length=180)
    record_hash = models.CharField(max_length=64, db_index=True)
    district = models.ForeignKey(District, null=True, blank=True, on_delete=models.SET_NULL, related_name="osiris_records")
    hazard_type = models.CharField(max_length=50, blank=True)
    observed_at = models.DateTimeField(null=True, blank=True)
    ingested_at = models.DateTimeField(auto_now_add=True)
    confidence = models.FloatField(default=0.5)
    freshness = models.FloatField(default=1.0)
    validation_status = models.CharField(max_length=30, default="validated")
    normalized_payload = models.JSONField(default=dict)
    raw_payload = models.JSONField(default=dict)
    duplicate_of = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="duplicates")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["source", "external_id"], name="uniq_osiris_source_external")]
        ordering = ["-observed_at", "-ingested_at"]
