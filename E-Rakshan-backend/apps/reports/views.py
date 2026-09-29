from rest_framework.views import APIView
from rest_framework.response import Response
from apps.districts.models import District
from apps.intelligence.services import situation_summary
class SituationReportView(APIView):
    def get(self,request):
        d=District.objects.filter(pk=request.query_params.get("district")).first()
        return Response({"report_type":"situation_summary","data":situation_summary(d)})
