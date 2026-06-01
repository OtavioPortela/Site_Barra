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
    path('verificar-pin/', views.verificar_pin_view, name='verificar-pin'),
    path('faturados-no-dia/', views.faturados_no_dia_view, name='faturados-no-dia'),
    path('', include(router.urls)),
]
