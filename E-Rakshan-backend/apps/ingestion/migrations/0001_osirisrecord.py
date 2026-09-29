from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [("districts", "0001_initial")]
    operations = [migrations.CreateModel(name="OsirisRecord", fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("source", models.CharField(max_length=120)), ("external_id", models.CharField(max_length=180)),
        ("record_hash", models.CharField(db_index=True, max_length=64)), ("hazard_type", models.CharField(blank=True, max_length=50)),
        ("observed_at", models.DateTimeField(blank=True, null=True)), ("ingested_at", models.DateTimeField(auto_now_add=True)),
        ("confidence", models.FloatField(default=0.5)), ("freshness", models.FloatField(default=1.0)),
        ("validation_status", models.CharField(default="validated", max_length=30)), ("normalized_payload", models.JSONField(default=dict)), ("raw_payload", models.JSONField(default=dict)),
        ("district", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="osiris_records", to="districts.district")),
        ("duplicate_of", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="duplicates", to="ingestion.osirisrecord")),
    ], options={"ordering": ["-observed_at", "-ingested_at"]}),
    migrations.AddConstraint(model_name="osirisrecord", constraint=models.UniqueConstraint(fields=("source", "external_id"), name="uniq_osiris_source_external"))]
