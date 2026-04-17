from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Usuario
from apps.ordens_servico.models import Cliente


def criar_usuario(email='user@barra.com', password='senha123', is_staff=False):
    return Usuario.objects.create_user(
        username=email, email=email, password=password,
        nome_completo='Usuario Teste', is_staff=is_staff,
    )


def autenticar(client, email='user@barra.com', password='senha123'):
    response = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


def criar_cliente(**kwargs):
    dados = {'nome': 'Cliente Teste', 'telefone': '31999990000'}
    dados.update(kwargs)
    return Cliente.objects.create(**dados)


class ClienteListCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()
        autenticar(self.client)

    def _resultados(self, response):
        data = response.data
        if isinstance(data, list):
            return data
        return data.get('results', data)

    def test_listar_clientes_autenticado(self):
        criar_cliente(nome='Ana')
        criar_cliente(nome='Bruno')
        response = self.client.get('/api/clientes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultados = self._resultados(response)
        self.assertEqual(len(resultados), 2)

    def test_listar_apenas_clientes_ativos(self):
        criar_cliente(nome='Ativo')
        cliente_inativo = criar_cliente(nome='Inativo')
        cliente_inativo.ativo = False
        cliente_inativo.save()
        response = self.client.get('/api/clientes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultados = self._resultados(response)
        nomes = [c['nome'] for c in resultados]
        self.assertIn('Ativo', nomes)
        self.assertNotIn('Inativo', nomes)

    def test_listar_sem_autenticacao(self):
        self.client.credentials()
        response = self.client.get('/api/clientes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_cliente_valido(self):
        response = self.client.post('/api/clientes/', {
            'nome': 'Cliente Novo',
            'telefone': '31999990001',
            'email': 'cliente@email.com',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], 'Cliente Novo')
        self.assertTrue(Cliente.objects.filter(nome='Cliente Novo').exists())

    def test_criar_cliente_sem_nome(self):
        response = self.client.post('/api/clientes/', {
            'telefone': '31999990001',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_criar_cliente_parceiro(self):
        response = self.client.post('/api/clientes/', {
            'nome': 'Parceiro SA',
            'telefone': '31999990002',
            'eh_parceiro': True,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['eh_parceiro'])

    def test_busca_por_nome(self):
        criar_cliente(nome='Maria Silva')
        criar_cliente(nome='João Souza')
        response = self.client.get('/api/clientes/?search=Maria')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultados = self._resultados(response)
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]['nome'], 'Maria Silva')


class ClienteDetailTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()
        autenticar(self.client)
        self.cliente = criar_cliente(nome='Cliente Detalhe', telefone='31999990000')

    def test_obter_cliente(self):
        response = self.client.get(f'/api/clientes/{self.cliente.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], 'Cliente Detalhe')

    def test_atualizar_cliente(self):
        response = self.client.patch(f'/api/clientes/{self.cliente.id}/', {
            'nome': 'Nome Atualizado',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], 'Nome Atualizado')
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.nome, 'Nome Atualizado')

    def test_deletar_cliente_soft_delete(self):
        response = self.client.delete(f'/api/clientes/{self.cliente.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Deve continuar no banco mas inativo
        self.cliente.refresh_from_db()
        self.assertFalse(self.cliente.ativo)

    def test_cliente_nao_encontrado(self):
        response = self.client.get('/api/clientes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
