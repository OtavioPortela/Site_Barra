from rest_framework import serializers
from .models import SaidaCaixa, ConfiguracaoEmpresa


class SaidaCaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaidaCaixa
        fields = ['id', 'descricao', 'valor', 'categoria', 'data', 'observacoes', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']


class ConfiguracaoEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoEmpresa
        fields = ['nome', 'cnpj', 'email', 'telefone', 'endereco']
