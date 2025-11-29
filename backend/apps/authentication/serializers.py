from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Usuario."""

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'username', 'nome_completo', 'cargo', 'telefone', 'ativo', 'is_staff', 'data_criacao']
        read_only_fields = ['id', 'data_criacao', 'is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirmação de Senha')

    class Meta:
        model = Usuario
        fields = ['email', 'username', 'nome_completo', 'password', 'password2', 'cargo', 'telefone']

    def validate(self, attrs):
        """Valida se as senhas coincidem."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        """Cria um novo usuário."""
        validated_data.pop('password2')
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            nome_completo=validated_data['nome_completo'],
            password=validated_data['password'],
            cargo=validated_data.get('cargo', ''),
            telefone=validated_data.get('telefone', ''),
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para login."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class TokenResponseSerializer(serializers.Serializer):
    """Serializer para resposta de token JWT."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UsuarioSerializer()


class CreateFuncionarioSerializer(serializers.ModelSerializer):
    """Serializer para criação de funcionários (apenas admin)."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirmação de Senha')

    class Meta:
        model = Usuario
        fields = ['email', 'username', 'nome_completo', 'password', 'password2', 'cargo', 'telefone']
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
        }

    def validate(self, attrs):
        """Valida se as senhas coincidem."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        """Cria um novo funcionário (is_staff=False por padrão)."""
        validated_data.pop('password2')
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            nome_completo=validated_data['nome_completo'],
            password=validated_data['password'],
            cargo=validated_data.get('cargo', 'Funcionário'),
            telefone=validated_data.get('telefone', ''),
            is_staff=False,  # Funcionários não são admin por padrão
        )
        return user

