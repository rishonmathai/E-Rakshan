from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics

from .models import RelocationPlan
from .serializers import RelocationPlanSerializer
from .services import solve_relocation
from apps.habitations.models import Habitation


class SolveView(APIView):

    def post(self, request):
        ids = request.data.get("sources", [])
        sources = list(Habitation.objects.filter(id__in=ids))

        if not sources:
            return Response(
                {"error": "No valid source habitations"},
                status=400,
            )

        source_populations = request.data.get("source_populations", {})

        plan = solve_relocation(
            sources,
            float(request.data.get("max_distance_km", 15)),
            float(request.data.get("utilisation_cap", 0.95)),
            bool(request.data.get("allow_overflow", False)),
            request.data.get("weights"),
            source_populations,
        )

        return Response(RelocationPlanSerializer(plan).data)


class PlanDetailView(generics.RetrieveAPIView):
    queryset = RelocationPlan.objects.all()
    serializer_class = RelocationPlanSerializer