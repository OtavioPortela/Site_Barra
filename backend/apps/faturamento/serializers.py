from rest_framework import serializers
from .models import SaidaCaixa, ConfiguracaoEmpresa


class SaidaCaixaSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = SaidaCaixa
        fields = ['id', 'tipo', 'descricao', 'valor', 'categoria', 'tipo_material', 'data', 'observacoes', 'criado_por_nome', 'data_criacao']
        read_only_fields = ['id', 'criado_por_nome', 'data_criacao']

    def validate(self, attrs):
        tipo = attrs.get('tipo', self.instance.tipo if self.instance else 'saida')
        categoria = attrs.get('categoria', self.instance.categoria if self.instance else 'outro')
        tipo_material = attrs.get('tipo_material', self.instance.tipo_material if self.instance else '')
        if categoria != 'material':
            # Tipo de material só faz sentido em saídas de material
            attrs['tipo_material'] = ''
        elif tipo == 'saida' and not tipo_material:
            raise serializers.ValidationError({'tipo_material': 'Informe o tipo de material.'})
        return attrs

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
