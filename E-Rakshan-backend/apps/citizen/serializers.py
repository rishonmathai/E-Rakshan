from rest_framework import serializers

from apps.hazards.models import RedZone, HazardEvent
from apps.shelters.models import Shelter
from apps.infrastructure.models import Road
from apps.incidents.models import Incident
from apps.alerts.models import Alert


class CitizenRedZoneSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    radius = serializers.SerializerMethodField()

    class Meta:
        model = RedZone
        fields = [
            "id",
            "name",
            "hazard_type",
            "current_severity",
            "probability",
            "population_exposed",
            "active",
            "lat",
            "lng",
            "radius",
        ]

    def get_lat(self, obj):
        return obj.boundary.centroid.y if obj.boundary else None

    def get_lng(self, obj):
        return obj.boundary.centroid.x if obj.boundary else None

    def get_radius(self, obj):
        if not obj.boundary:
            return None

        geom = obj.boundary.clone()
        geom.transform(3857)

        min_x, min_y, max_x, max_y = geom.extent
        width = max_x - min_x
        height = max_y - min_y

        radius = ((width ** 2 + height ** 2) ** 0.5) / 2
        return round(radius, 2)


class CitizenShelterSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    free_capacity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Shelter
        fields = [
            "id",
            "name",
            "type",
            "capacity",
            "current_occupancy",
            "free_capacity",
            "medical_support",
            "water_kl",
            "sanitation_ok",
            "operational",
            "managed_by",
            "amenities",
            "updated_at",
            "lat",
            "lng",
        ]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_lng(self, obj):
        return obj.location.x if obj.location else None


class CitizenRoadSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    geometry = serializers.SerializerMethodField()

    class Meta:
        model = Road
        fields = [
            "id",
            "name",
            "road_class",
            "status",
            "flood_depth_cm",
            "surface",
            "connects_habitations",
            "lat",
            "lng",
            "geometry",
        ]

    def get_lat(self, obj):
        return obj.path.centroid.y if obj.path else None

    def get_lng(self, obj):
        return obj.path.centroid.x if obj.path else None

    def get_geometry(self, obj):
        if not obj.path:
            return []

        return [
            [float(lat), float(lng)]
            for lng, lat in obj.path.coords
        ]


class CitizenIncidentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "name",
            "incident_type",
            "severity",
            "status",
            "description",
            "source",
            "confidence",
            "authority_confirmed",
            "reported_at",
            "updated_at",
            "lat",
            "lng",
        ]

    def get_name(self, obj):
        return obj.location_name or obj.incident_type

    def get_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_lng(self, obj):
        return obj.location.x if obj.location else None


class CitizenHazardSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = HazardEvent
        fields = [
            "id",
            "name",
            "hazard_type",
            "severity",
            "probability",
            "source",
            "confidence",
            "observed_at",
            "lat",
            "lng",
        ]

    def get_name(self, obj):
        return obj.get_hazard_type_display()

    def get_lat(self, obj):
        return obj.location.centroid.y if obj.location else None

    def get_lng(self, obj):
        return obj.location.centroid.x if obj.location else None


class CitizenAlertSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            "id",
            "severity",
            "type",
            "title",
            "message",
            "location",
            "lat",
            "lng",
            "time",
            "unread",
            "source",
            "confidence",
            "status",
            "issued_at",
            "expires_at",
        ]

    def get_title(self, obj):
        return obj.alert_type

    def get_type(self, obj):
        return obj.alert_type

    def get_location(self, obj):
        return obj.district.name if obj.district else "Unknown location"

    def get_lat(self, obj):
        return obj.affected_area.centroid.y if obj.affected_area else None

    def get_lng(self, obj):
        return obj.affected_area.centroid.x if obj.affected_area else None

    def get_time(self, obj):
        return obj.issued_at.isoformat() if obj.issued_at else None

    def get_unread(self, obj):
        return obj.status == "new"
