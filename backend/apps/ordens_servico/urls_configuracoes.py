from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EstadoCabeloViewSet, TipoCabeloViewSet, CorCabeloViewSet, CorLinhaViewSet

router = DefaultRouter()
router.register(r'estado-cabelo', EstadoCabeloViewSet, basename='estado-cabelo')
router.register(r'tipo-cabelo', TipoCabeloViewSet, basename='tipo-cabelo')
router.register(r'cor-cabelo', CorCabeloViewSet, basename='cor-cabelo')
router.register(r'cor-linha', CorLinhaViewSet, basename='cor-linha')

urlpatterns = [
    path('', include(router.urls)),
]

