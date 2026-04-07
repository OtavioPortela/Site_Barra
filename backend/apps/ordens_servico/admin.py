from django.contrib import admin
from .models import Cliente, OrdemServico, Servico, EstadoCabelo, TipoCabelo, CorCabelo, CorLinha


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cnpj_cpf', 'email', 'telefone', 'eh_parceiro', 'ativo', 'data_cadastro']
    list_filter = ['ativo', 'eh_parceiro', 'data_cadastro']
    search_fields = ['nome', 'cnpj_cpf', 'email']
    ordering = ['-data_cadastro']


@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'ativo', 'data_criacao']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['nome', 'descricao']
    ordering = ['nome']


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    list_display = ['numero', 'cliente', 'servico', 'status', 'valor', 'prazo_entrega', 'data_criacao']
    list_filter = ['status', 'servico', 'estado_cabelo', 'tipo_cabelo', 'data_criacao', 'prazo_entrega']
    search_fields = ['numero', 'cliente__nome', 'descricao', 'cor_cabelo']
    ordering = ['-data_criacao']
    readonly_fields = ['numero', 'data_criacao', 'data_finalizacao']
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('numero', 'cliente', 'status', 'descricao')
        }),
        ('Detalhes do Cabelo', {
            'fields': ('estado_cabelo', 'tipo_cabelo', 'cor_cabelo', 'peso_gramas', 'tamanho_cabelo_cm', 'cor_linha')
        }),
        ('Serviço e Valores', {
            'fields': ('servico', 'valor_metro', 'valor')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'prazo_entrega', 'data_finalizacao')
        }),
        ('Outros', {
            'fields': ('observacoes', 'usuario_criacao')
        }),
    )



@admin.register(EstadoCabelo)
class EstadoCabeloAdmin(admin.ModelAdmin):
    list_display = ['nome', 'valor', 'ativo', 'ordem', 'data_criacao']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['nome', 'valor']
    ordering = ['ordem', 'nome']


@admin.register(TipoCabelo)
class TipoCabeloAdmin(admin.ModelAdmin):
    list_display = ['nome', 'valor', 'ativo', 'ordem', 'data_criacao']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['nome', 'valor']
    ordering = ['ordem', 'nome']


@admin.register(CorCabelo)
class CorCabeloAdmin(admin.ModelAdmin):
    list_display = ['nome', 'ativo', 'ordem', 'data_criacao']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['nome']
    ordering = ['ordem', 'nome']


@admin.register(CorLinha)
class CorLinhaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'ativo', 'ordem', 'data_criacao']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['nome']
    ordering = ['ordem', 'nome']

