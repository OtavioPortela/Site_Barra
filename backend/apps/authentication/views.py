from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Usuario
from .serializers import (
    UsuarioSerializer,
    RegisterSerializer,
    LoginSerializer,
    TokenResponseSerializer,
    CreateFuncionarioSerializer
)
from apps.ordens_servico.permissions import IsStaffOnly


class RegisterView(generics.CreateAPIView):
    """View para registro de novos usuários."""
    queryset = Usuario.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UsuarioSerializer(user).data
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """View para login de usuários."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    # Autenticar usando email (USERNAME_FIELD do modelo Usuario)
    user = authenticate(request, username=email, password=password)

    if user is None or not user.is_active:
        return Response(
            {'error': 'Credenciais inválidas ou usuário inativo.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Gerar tokens JWT
    refresh = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'token': str(refresh.access_token),  # Compatibilidade com frontend
        'user': {
            'id': user.id,
            'email': user.email,
            'nome': user.nome_completo,
            'nome_completo': user.nome_completo,
            'is_staff': user.is_staff,
            'cargo': user.cargo or '',
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """View para logout (blacklist do refresh token)."""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': 'Erro ao realizar logout.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """View para obter dados do usuário logado."""
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


class FuncionarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de funcionários (apenas admin)."""
    queryset = Usuario.objects.all().order_by('-data_criacao')
    permission_classes = [IsAuthenticated, IsStaffOnly]
    pagination_class = None

    def get_serializer_class(self):
        """Retorna serializer apropriado para cada ação."""
        if self.action == 'create':
            return CreateFuncionarioSerializer
        return UsuarioSerializer

    def perform_create(self, serializer):
        """Garante que funcionários criados não sejam admin."""
        user = serializer.save()
        # Garantir que is_staff seja False (funcionários não são admin)
        user.is_staff = False
        user.save()

    def get_queryset(self):
        """Retorna todos os usuários (admin pode ver todos)."""
        return Usuario.objects.all().order_by('-data_criacao')

