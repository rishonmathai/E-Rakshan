from django.urls import path

from .views import (
    DaminiLightningView,
    IngestionHealthView,
    NormalizeView,
    OsirisRecordListView,
    WeatherView,
)

urlpatterns = [
    path("health/", IngestionHealthView.as_view()),
    path("weather/", WeatherView.as_view()),
    path("damini/", DaminiLightningView.as_view()),
    path("normalize/", NormalizeView.as_view()),
    path("osiris/records/", OsirisRecordListView.as_view()),
]