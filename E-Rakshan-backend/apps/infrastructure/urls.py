from django.urls import path
from .views import RoadListView
urlpatterns=[path("",RoadListView.as_view())]
