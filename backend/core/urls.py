"""
URL configuration for barra_confeccoes project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import JsonResponse
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="Barra Confecções API",
      default_version='v1',
      description="API para gerenciamento de ordens de serviço da Barra Confecções",
      contact=openapi.Contact(email="admin@barraconfeccoes.com"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check endpoint para Railway
    path('health/', lambda request: JsonResponse({'status': 'ok'}), name='health'),

    # API URLs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/clientes/', include('apps.ordens_servico.urls_clientes')),
    path('api/servicos/', include('apps.ordens_servico.urls_servicos')),
    path('api/ordens-servico/', include('apps.ordens_servico.urls')),
    path('api/faturamento/', include('apps.faturamento.urls')),
    path('api/whatsapp/', include('apps.whatsapp.urls')),
    path('api/configuracoes/', include('apps.ordens_servico.urls_configuracoes')),
    path('api/debitos/', include('apps.ordens_servico.urls_debitos')),

    # Swagger Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media independente de DEBUG (necessário com DEBUG=False no Railway)
urlpatterns += [re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT})]
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

