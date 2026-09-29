from django.urls import include, path
from apps.districts.urls import urlpatterns as district_urls
from apps.habitations.urls import urlpatterns as habitation_urls
from apps.hazards.urls import urlpatterns as hazard_urls
from apps.shelters.urls import urlpatterns as shelter_urls
from apps.sites.urls import urlpatterns as site_urls
from apps.infrastructure.urls import urlpatterns as infra_urls
from apps.incidents.urls import urlpatterns as incident_urls
from apps.alerts.urls import urlpatterns as alert_urls
from apps.relocation.urls import urlpatterns as relocation_urls
from apps.intelligence.urls import urlpatterns as intelligence_urls
from apps.ingestion.urls import urlpatterns as ingestion_urls
from apps.audit.urls import urlpatterns as audit_urls
from apps.reports.urls import urlpatterns as report_urls
from apps.accounts.urls import urlpatterns as account_urls
from apps.districts.views import DashboardSummaryView, GISLayersView, SearchView
from apps.sai_views import SAIQueryView, SAIBriefingView
from apps.citizen.urls import urlpatterns as citizen_urls

urlpatterns = [
    path("", DashboardSummaryView.as_view(), name="api-root"),
    path("dashboard/summary/", DashboardSummaryView.as_view()),
    path("districts/", include((district_urls, "districts"))),
    path("habitations/", include((habitation_urls, "habitations"))),
    path("hazards/", include((hazard_urls, "hazards"))),
    path("shelters/", include((shelter_urls, "shelters"))),
    path("sites/", include((site_urls, "sites"))),
    path("roads/", include((infra_urls, "infrastructure"))),
    path("incidents/", include((incident_urls, "incidents"))),
    path("alerts/", include((alert_urls, "alerts"))),
    path("relocation/", include((relocation_urls, "relocation"))),
    path("risk/", include((intelligence_urls, "intelligence"))),
    path("ingestion/", include((ingestion_urls, "ingestion"))),
    path("decisions/", include((audit_urls, "audit"))),
    path("reports/", include((report_urls, "reports"))),
    path("accounts/", include((account_urls, "accounts"))),
    path("gis/layers/", GISLayersView.as_view()),
    path("search/", SearchView.as_view()),
    path("sai/briefing/", SAIBriefingView.as_view()),
    path("sai/query/", SAIQueryView.as_view()),
    path("citizen/", include((citizen_urls, "citizen"))),
]
