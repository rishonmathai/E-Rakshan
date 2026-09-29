from django.urls import path
from .views import SolveView, PlanDetailView
urlpatterns=[path("solve/",SolveView.as_view()),path("plans/<int:pk>/",PlanDetailView.as_view())]
