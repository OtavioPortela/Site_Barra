"""
Testa a permissão IsStaffOrReadOnly nos endpoints de configurações de cabelo.
Funcionários devem poder LER mas não ESCREVER/DELETAR.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Usuario
from apps.ordens_servico.models import EstadoCabelo, TipoCabelo, CorCabelo, CorLinha


def criar_usuario(email, is_staff=False):
    return Usuario.objects.create_user(
        username=email, email=email, password='senha123',
        nome_completo='Teste', is_staff=is_staff,
    )


def autenticar(client, email):
    response = client.post('/api/auth/login/', {'email': email, 'password': 'senha123'}, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


ENDPOINTS = [
    ('/api/configuracoes/estado-cabelo/', {'nome': 'Teste', 'valor': 'teste', 'ordem': 99}),
    ('/api/configuracoes/tipo-cabelo/',   {'nome': 'Teste', 'valor': 'teste', 'ordem': 99}),
    ('/api/configuracoes/cor-cabelo/',    {'nome': 'Teste', 'ordem': 99}),
    ('/api/configuracoes/cor-linha/',     {'nome': 'Teste', 'ordem': 99}),
]


class FuncionarioLeituraConfiguracoes(TestCase):
    """Funcionário (não staff) pode ler todas as configurações de cabelo."""

    def setUp(self):
        self.client = APIClient()
        criar_usuario('func@barra.com', is_staff=False)
        autenticar(self.client, 'func@barra.com')
        EstadoCabelo.objects.create(nome='Novo', valor='novo', ordem=1)
        TipoCabelo.objects.create(nome='Liso', valor='liso', ordem=1)
        CorCabelo.objects.create(nome='Preto', ordem=1)
        CorLinha.objects.create(nome='Preta', ordem=1)

    def test_funcionario_le_estado_cabelo(self):
        response = self.client.get('/api/configuracoes/estado-cabelo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_funcionario_le_tipo_cabelo(self):
        response = self.client.get('/api/configuracoes/tipo-cabelo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_funcionario_le_cor_cabelo(self):
        response = self.client.get('/api/configuracoes/cor-cabelo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_funcionario_le_cor_linha(self):
        response = self.client.get('/api/configuracoes/cor-linha/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class FuncionarioEscritaConfiguracoesBloqueada(TestCase):
    """Funcionário (não staff) NÃO pode criar, editar ou deletar configurações."""

    def setUp(self):
        self.client = APIClient()
        criar_usuario('func@barra.com', is_staff=False)
        autenticar(self.client, 'func@barra.com')
        self.estado = EstadoCabelo.objects.create(nome='Novo', valor='novo', ordem=1)

    def test_funcionario_nao_cria_estado_cabelo(self):
        response = self.client.post(
            '/api/configuracoes/estado-cabelo/',
            {'nome': 'X', 'valor': 'x', 'ordem': 99}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_funcionario_nao_edita_estado_cabelo(self):
        response = self.client.patch(
            f'/api/configuracoes/estado-cabelo/{self.estado.id}/',
            {'nome': 'Alterado'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_funcionario_nao_deleta_estado_cabelo(self):
        response = self.client.delete(f'/api/configuracoes/estado-cabelo/{self.estado.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_funcionario_nao_cria_tipo_cabelo(self):
        response = self.client.post(
            '/api/configuracoes/tipo-cabelo/',
            {'nome': 'X', 'valor': 'x', 'ordem': 99}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_funcionario_nao_cria_cor_cabelo(self):
        response = self.client.post(
            '/api/configuracoes/cor-cabelo/',
            {'nome': 'X', 'ordem': 99}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_funcionario_nao_cria_cor_linha(self):
        response = self.client.post(
            '/api/configuracoes/cor-linha/',
            {'nome': 'X', 'ordem': 99}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminEscritaConfiguracoes(TestCase):
    """Admin (staff) pode criar, editar e deletar configurações."""

    def setUp(self):
        self.client = APIClient()
        criar_usuario('admin@barra.com', is_staff=True)
        autenticar(self.client, 'admin@barra.com')

    def test_admin_cria_estado_cabelo(self):
        response = self.client.post(
            '/api/configuracoes/estado-cabelo/',
            {'nome': 'Ruivo', 'valor': 'ruivo', 'ordem': 10}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EstadoCabelo.objects.filter(valor='ruivo').exists())

    def test_admin_cria_cor_cabelo(self):
        response = self.client.post(
            '/api/configuracoes/cor-cabelo/',
            {'nome': 'Azul', 'ordem': 10}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_cria_cor_linha(self):
        response = self.client.post(
            '/api/configuracoes/cor-linha/',
            {'nome': 'Verde', 'ordem': 10}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_sem_autenticacao_retorna_401(self):
        self.client.credentials()
        response = self.client.get('/api/configuracoes/estado-cabelo/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
