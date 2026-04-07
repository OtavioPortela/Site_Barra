from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'saidas-caixa', views.SaidaCaixaViewSet, basename='saidas-caixa')

urlpatterns = [
    path('', views.dashboard_view, name='faturamento-dashboard'),
    path('dashboard/', views.dashboard_view, name='faturamento-dashboard-alt'),
    path('por-periodo/', views.por_periodo_view, name='faturamento-por-periodo'),
    path('por-cliente/', views.por_cliente_view, name='faturamento-por-cliente'),
    path('relatorio/', views.relatorio_view, name='faturamento-relatorio'),
    path('configuracao-empresa/', views.configuracao_empresa_view, name='configuracao-empresa'),
    path('', include(router.urls)),
]
