from rest_framework import serializers
from django.utils import timezone
from datetime import date
from django.conf import settings
from .models import Cliente, OrdemServico, ItemOrdemServico, Servico, EstadoCabelo, TipoCabelo, CorCabelo, CorLinha


class DateTimeFieldISO(serializers.DateTimeField):
    """Campo de data/hora que retorna formato ISO 8601."""
    def to_representation(self, value):
        if value is None:
            return None
        return value.isoformat()


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Cliente."""

    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'cnpj_cpf', 'email', 'telefone', 'endereco', 'ativo', 'data_cadastro']
        read_only_fields = ['id', 'data_cadastro']

    def validate_cnpj_cpf(self, value):
        """Validação básica de CNPJ/CPF."""
        # Remove caracteres não numéricos
        cnpj_cpf_limpo = ''.join(filter(str.isdigit, value))
        if len(cnpj_cpf_limpo) not in [11, 14]:
            raise serializers.ValidationError("CNPJ/CPF deve ter 11 (CPF) ou 14 (CNPJ) dígitos.")
        return value


class ItemOrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer para itens de ordem de serviço."""

    class Meta:
        model = ItemOrdemServico
        fields = ['id', 'descricao', 'quantidade', 'valor_unitario', 'valor_total']
        read_only_fields = ['id', 'valor_total']


class OrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo OrdemServico."""
    cliente = serializers.SerializerMethodField()
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.filter(ativo=True),
        source='cliente',
        write_only=True,
        required=False
    )
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    cliente_telefone = serializers.CharField(source='cliente.telefone', read_only=True)
    servico = serializers.SerializerMethodField()
    servico_id = serializers.PrimaryKeyRelatedField(
        queryset=Servico.objects.filter(ativo=True),
        source='servico',
        write_only=True,
        required=False
    )
    servico_nome = serializers.CharField(source='servico.nome', read_only=True)
    usuario_criacao_nome = serializers.CharField(source='usuario_criacao.nome_completo', read_only=True)
    data_criacao = DateTimeFieldISO(read_only=True)
    prazo_entrega = serializers.DateField()
    data_finalizacao = DateTimeFieldISO(read_only=True, allow_null=True)
    data_faturamento = DateTimeFieldISO(read_only=True, allow_null=True)
    faturada = serializers.BooleanField(read_only=True)
    itens = ItemOrdemServicoSerializer(many=True, read_only=True, required=False)
    numero = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'cliente', 'cliente_id', 'cliente_nome', 'cliente_telefone', 'descricao', 'status',
            'estado_cabelo', 'tipo_cabelo', 'cor_cabelo', 'peso_gramas',
            'tamanho_cabelo_cm', 'cor_linha', 'servico', 'servico_id', 'servico_nome', 'valor_metro',
            'valor', 'data_criacao', 'prazo_entrega', 'data_finalizacao', 'faturada', 'data_faturamento',
            'observacoes', 'usuario_criacao', 'usuario_criacao_nome', 'itens', 'entregue', 'pago_na_entrega', 'foto_entrega', 'forma_pagamento'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_finalizacao', 'faturada', 'data_faturamento', 'usuario_criacao']


    def get_cliente(self, obj):
        """Retorna o nome do cliente como string para compatibilidade com frontend."""
        return obj.cliente.nome if obj.cliente else None

    def get_servico(self, obj):
        """Retorna o nome do serviço como string para compatibilidade com frontend."""
        return obj.servico.nome if obj.servico else None

    def to_representation(self, instance):
        """Ajusta a representação para garantir formato correto."""
        data = super().to_representation(instance)
        # Garantir que cliente é sempre string
        if 'cliente' not in data or data['cliente'] is None:
            data['cliente'] = instance.cliente.nome if instance.cliente else None
        # Garantir que servico é sempre string
        if 'servico' not in data or data['servico'] is None:
            data['servico'] = instance.servico.nome if instance.servico else None
        # Garantir que foto_entrega retorna URL completa quando existir
        if 'foto_entrega' in data and data['foto_entrega']:
            request = self.context.get('request')
            if request:
                data['foto_entrega'] = request.build_absolute_uri(instance.foto_entrega.url)
            else:
                # Fallback se não houver request no context
                data['foto_entrega'] = f"{settings.MEDIA_URL}{instance.foto_entrega.name}" if instance.foto_entrega else None
        return data

    def validate(self, attrs):
        """Valida e processa cliente e serviço se for enviado como string."""
        # Se cliente foi enviado como string (nome), buscar pelo nome
        cliente_str = self.initial_data.get('cliente')
        if cliente_str and isinstance(cliente_str, str) and not attrs.get('cliente'):
            try:
                cliente = Cliente.objects.get(nome=cliente_str, ativo=True)
                attrs['cliente'] = cliente
            except Cliente.DoesNotExist:
                raise serializers.ValidationError({
                    'cliente': f'Cliente "{cliente_str}" não encontrado.'
                })
            except Cliente.MultipleObjectsReturned:
                # Se houver múltiplos, pegar o primeiro
                cliente = Cliente.objects.filter(nome=cliente_str, ativo=True).first()
                attrs['cliente'] = cliente

        # Se serviço foi enviado como string (nome), buscar pelo nome
        servico_str = self.initial_data.get('servico')
        if servico_str and isinstance(servico_str, str) and not attrs.get('servico'):
            try:
                servico = Servico.objects.get(nome=servico_str, ativo=True)
                attrs['servico'] = servico
            except Servico.DoesNotExist:
                raise serializers.ValidationError({
                    'servico': f'Serviço "{servico_str}" não encontrado.'
                })
            except Servico.MultipleObjectsReturned:
                # Se houver múltiplos, pegar o primeiro
                servico = Servico.objects.filter(nome=servico_str, ativo=True).first()
                attrs['servico'] = servico

        # Validações existentes
        status = attrs.get('status', self.instance.status if self.instance else 'pendente')
        valor = attrs.get('valor', self.instance.valor if self.instance else None)

        if status == 'finalizada' and (not valor or valor <= 0):
            raise serializers.ValidationError({
                "valor": "Não é possível finalizar uma OS sem valor definido."
            })

        return attrs

    def validate_valor(self, value):
        """Valida que o valor não seja negativo."""
        if value < 0:
            raise serializers.ValidationError("O valor não pode ser negativo.")
        return value

    def validate_prazo_entrega(self, value):
        """Valida que o prazo não seja no passado."""
        if value < date.today():
            raise serializers.ValidationError("O prazo de entrega não pode ser no passado.")
        return value

    def create(self, validated_data):
        """Cria uma nova ordem de serviço."""
        # Define o usuário de criação
        validated_data['usuario_criacao'] = self.context['request'].user

        # Garante valor padrão para campo entregue
        if 'entregue' not in validated_data:
            validated_data['entregue'] = False

        # Garante valor padrão para campo pago_na_entrega
        if 'pago_na_entrega' not in validated_data:
            validated_data['pago_na_entrega'] = False

        # Se numero foi fornecido, validar; se não, será gerado pelo signal
        numero_fornecido = validated_data.get('numero')
        if numero_fornecido:
            # Verificar se já existe
            if OrdemServico.objects.filter(numero=numero_fornecido).exists():
                raise serializers.ValidationError({
                    'numero': f'Já existe uma OS com o número {numero_fornecido}.'
                })
        # Se não fornecido, o signal gerará automaticamente

        return super().create(validated_data)


class OrdemServicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de OS."""
    cliente = serializers.CharField(source='cliente.nome', read_only=True)
    cliente_telefone = serializers.CharField(source='cliente.telefone', read_only=True)
    data_criacao = DateTimeFieldISO(read_only=True)
    prazo_entrega = serializers.DateField()
    data_finalizacao = DateTimeFieldISO(read_only=True, allow_null=True)
    faturada = serializers.BooleanField(read_only=True)

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'cliente', 'cliente_telefone', 'descricao', 'status',
            'valor', 'data_criacao', 'prazo_entrega', 'data_finalizacao', 'faturada', 'entregue', 'pago_na_entrega', 'foto_entrega', 'forma_pagamento'
        ]


class OrdemServicoStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização apenas do status."""

    class Meta:
        model = OrdemServico
        fields = ['status']

    def validate_status(self, value):
        """Valida transições de status."""
        if self.instance:
            status_atual = self.instance.status

            # Regras de transição de status
            transicoes_validas = {
                'pendente': ['em_desenvolvimento', 'finalizada'],
                'em_desenvolvimento': ['pendente', 'finalizada'],
                'finalizada': ['em_desenvolvimento']  # Pode voltar para em desenvolvimento
            }

            if value not in transicoes_validas.get(status_atual, []):
                raise serializers.ValidationError(
                    f"Transição de '{status_atual}' para '{value}' não é permitida."
                )

        return value

class ServicoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Servico."""

    class Meta:
        model = Servico
        fields = ['id', 'nome', 'descricao', 'ativo', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']


class EstadoCabeloSerializer(serializers.ModelSerializer):
    """Serializer para o modelo EstadoCabelo."""

    class Meta:
        model = EstadoCabelo
        fields = ['id', 'nome', 'valor', 'ativo', 'ordem', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']


class TipoCabeloSerializer(serializers.ModelSerializer):
    """Serializer para o modelo TipoCabelo."""

    class Meta:
        model = TipoCabelo
        fields = ['id', 'nome', 'valor', 'ativo', 'ordem', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']


class CorCabeloSerializer(serializers.ModelSerializer):
    """Serializer para o modelo CorCabelo."""

    class Meta:
        model = CorCabelo
        fields = ['id', 'nome', 'ativo', 'ordem', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']


class CorLinhaSerializer(serializers.ModelSerializer):
    """Serializer para o modelo CorLinha."""

    class Meta:
        model = CorLinha
        fields = ['id', 'nome', 'ativo', 'ordem', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']
