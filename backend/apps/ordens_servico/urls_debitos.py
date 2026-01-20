from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DebitoViewSet

router = DefaultRouter()
router.register(r'', DebitoViewSet, basename='debitos')

urlpatterns = [
    path('', include(router.urls)),
]

