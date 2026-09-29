import hashlib

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import DecisionLog
from .serializers import DecisionLogSerializer


class DecisionLogListCreateView(generics.ListCreateAPIView):
    queryset = DecisionLog.objects.all().order_by("-created_at")
    serializer_class = DecisionLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        obj = serializer.save(user=self.request.user)
        obj.audit_hash = hashlib.sha256(
            f"{obj.user_id}|{obj.event_type}|{obj.recommendation}|"
            f"{obj.decision}|{obj.created_at.isoformat()}".encode()
        ).hexdigest()
        obj.save(update_fields=["audit_hash"])