from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.districts.models import District
from apps.intelligence.services import situation_summary, explain_habitation

class SAIBriefingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        district = District.objects.filter(pk=request.query_params.get("district")).first()
        if not district:
            district = District.objects.order_by("name").first()
        return Response(situation_summary(district) if district else {"message": "No district data available."})

class SAIQueryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        q = (request.query_params.get("q") or "").strip().lower()
        district_id = request.query_params.get("district")
        if "brief" in q or "situation" in q or "status" in q:
            district = District.objects.filter(pk=district_id).first() if district_id else District.objects.first()
            return Response(situation_summary(district))
        return Response({
            "matched": False,
            "message": "Operational query not recognized by the backend. Keep deterministic operational commands in the SAI command engine; open-ended questions may continue to Ollama."
        })
