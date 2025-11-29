"""
URL configuration for barra_confeccoes project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
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

    # API URLs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/clientes/', include('apps.ordens_servico.urls_clientes')),
    path('api/servicos/', include('apps.ordens_servico.urls_servicos')),
    path('api/ordens-servico/', include('apps.ordens_servico.urls')),
    path('api/faturamento/', include('apps.faturamento.urls')),

    # Swagger Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Servir arquivos estáticos e media em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

