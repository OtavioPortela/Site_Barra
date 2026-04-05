from django.urls import path
from . import views

app_name = 'whatsapp'

urlpatterns = [
    path('status/', views.status_instancia, name='status'),
    path('enviar/', views.enviar_mensagem, name='enviar'),
    path('enviar-imagem/', views.enviar_imagem, name='enviar_imagem'),
    path('enviar-nota-os/', views.enviar_nota_os, name='enviar_nota_os'),
    path('enviar-os-criada/', views.enviar_os_criada, name='enviar_os_criada'),
]
