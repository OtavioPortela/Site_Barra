from rest_framework import serializers
from .models import SaidaCaixa


class SaidaCaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaidaCaixa
        fields = ['id', 'descricao', 'valor', 'categoria', 'data', 'observacoes', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']
