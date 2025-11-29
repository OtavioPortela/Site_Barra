from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_view, name='faturamento-dashboard'),
    path('dashboard/', views.dashboard_view, name='faturamento-dashboard-alt'),
    path('por-periodo/', views.por_periodo_view, name='faturamento-por-periodo'),
    path('por-cliente/', views.por_cliente_view, name='faturamento-por-cliente'),
    path('relatorio/', views.relatorio_view, name='faturamento-relatorio'),
]

