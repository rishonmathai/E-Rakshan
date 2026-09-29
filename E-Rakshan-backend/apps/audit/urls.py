from django.urls import path
from .views import DecisionLogListCreateView
urlpatterns=[path("log/",DecisionLogListCreateView.as_view()),path("",DecisionLogListCreateView.as_view())]
