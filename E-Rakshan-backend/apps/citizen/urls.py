from django.urls import path

from .views import (
    CitizenAlertListView,
    CitizenHazardListView,
    CitizenIncidentListView,
    CitizenOfflineRoadPackView,
    CitizenRedZoneListView,
    CitizenRoadListView,
    CitizenShelterListView,
    CitizenSOSLocationView,
    CitizenSOSView,
    CitizenSyncView,
)

urlpatterns = [
    path("red-zones", CitizenRedZoneListView.as_view(), name="citizen-red-zones"),
    path("shelters", CitizenShelterListView.as_view(), name="citizen-shelters"),
    path("roads", CitizenRoadListView.as_view(), name="citizen-roads"),
    path("incidents", CitizenIncidentListView.as_view(), name="citizen-incidents"),
    path("hazards", CitizenHazardListView.as_view(), name="citizen-hazards"),
    path("alerts", CitizenAlertListView.as_view(), name="citizen-alerts"),
    path("sync", CitizenSyncView.as_view(), name="citizen-sync"),
    path("offline-road-pack", CitizenOfflineRoadPackView.as_view(), name="citizen-offline-road-pack"),
    path("sos", CitizenSOSView.as_view(), name="citizen-sos"),
    path("sos/<str:session_id>/location", CitizenSOSLocationView.as_view(), name="citizen-sos-location"),
]
