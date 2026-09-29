from rest_framework.views import APIView
from rest_framework.response import Response
from apps.habitations.models import Habitation
from .services import recalculate_habitation, situation_summary
class RiskRecalculateView(APIView):
    def post(self, request):
        qs = Habitation.objects.filter(district_id=request.data.get("district")) if request.data.get("district") else Habitation.objects.all()
        updated = [recalculate_habitation(h) for h in qs]
        return Response({"updated":len(updated),"habitations":[{"id":h.id,"priority_score":h.priority_score,"band":h.risk_band} for h in updated]})
class RiskMatrixView(APIView):
    def get(self, request):
        qs = Habitation.objects.filter(district_id=request.query_params.get("district")) if request.query_params.get("district") else Habitation.objects.all()
        return Response({"matrix":[["low","moderate","high"],["moderate","high","critical"],["high","critical","critical"]],
                         "bands_summary":{"low":qs.filter(priority_score__lt=.4).count(),"moderate":qs.filter(priority_score__gte=.4,priority_score__lt=.6).count(),"high":qs.filter(priority_score__gte=.6,priority_score__lt=.8).count(),"critical":qs.filter(priority_score__gte=.8).count()}})
