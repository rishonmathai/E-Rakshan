from django.urls import path
from .views import *
urlpatterns=[path("",ShelterListView.as_view()),path("<str:pk>/occupancy/",ShelterOccupancyView.as_view()),path("<str:pk>/operational/",ShelterOperationalView.as_view())]
