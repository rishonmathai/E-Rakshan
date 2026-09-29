from django.urls import path
from .views import SituationReportView
urlpatterns=[path("situation-summary/",SituationReportView.as_view())]
