from rest_framework import serializers
from .models import SaidaCaixa, ConfiguracaoEmpresa


class SaidaCaixaSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = SaidaCaixa
        fields = ['id', 'tipo', 'descricao', 'valor', 'categoria', 'data', 'observacoes', 'criado_por_nome', 'data_criacao']
        read_only_fields = ['id', 'criado_por_nome', 'data_criacao']

    def get_criado_por_nome(self, obj):
        if obj.criado_por:
            return obj.criado_por.nome_completo or obj.criado_por.email
        return None


class ConfiguracaoEmpresaSerializer(serializers.ModelSerializer):
    tem_pin = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracaoEmpresa
        fields = ['nome', 'cnpj', 'email', 'telefone', 'endereco', 'pin_faturamento', 'tem_pin']
        extra_kwargs = {
            'pin_faturamento': {'write_only': True},
        }

    def get_tem_pin(self, obj):
        return bool(obj.pin_faturamento)
