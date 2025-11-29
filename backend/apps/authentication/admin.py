from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ['email', 'nome_completo', 'cargo', 'ativo', 'data_criacao']
    list_filter = ['ativo', 'is_staff', 'is_superuser', 'data_criacao']
    search_fields = ['email', 'nome_completo', 'username']
    ordering = ['-data_criacao']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações Adicionais', {'fields': ('nome_completo', 'cargo', 'telefone', 'ativo')}),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informações Adicionais', {'fields': ('nome_completo', 'cargo', 'telefone', 'ativo')}),
    )
