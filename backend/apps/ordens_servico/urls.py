from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrdemServicoViewSet

router = DefaultRouter()
router.register(r'', OrdemServicoViewSet, basename='ordens-servico')

urlpatterns = [
    path('', include(router.urls)),
]

