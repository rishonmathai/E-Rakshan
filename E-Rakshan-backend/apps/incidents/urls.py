from django.urls import path
from .views import IncidentListCreateView, IncidentVerifyView
urlpatterns=[path("",IncidentListCreateView.as_view()),path("<str:pk>/verify/",IncidentVerifyView.as_view())]
