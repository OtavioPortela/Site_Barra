from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """Modelo customizado de usuário."""
    email = models.EmailField(unique=True)
    nome_completo = models.CharField(max_length=200)
    cargo = models.CharField(max_length=100, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nome_completo']

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['-data_criacao']

    def __str__(self):
        return f"{self.nome_completo} ({self.email})"

