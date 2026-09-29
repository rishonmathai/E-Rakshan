from django.urls import path
from .views import *
urlpatterns=[path("events/",HazardEventListView.as_view()),path("red-zones/",RedZoneListView.as_view())]
