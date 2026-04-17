from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import date, timedelta
from apps.authentication.models import Usuario
from apps.ordens_servico.models import Cliente, OrdemServico, Servico


def criar_usuario(email='user@barra.com', password='senha123', is_staff=False):
    return Usuario.objects.create_user(
        username=email, email=email, password=password,
        nome_completo='Usuario Teste', is_staff=is_staff,
    )


def autenticar(client, email='user@barra.com', password='senha123'):
    response = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return token


def criar_cliente(**kwargs):
    dados = {'nome': 'Cliente OS', 'telefone': '31999990000'}
    dados.update(kwargs)
    return Cliente.objects.create(**dados)


def criar_servico(nome='Costura Básica'):
    return Servico.objects.create(nome=nome)


def criar_os(usuario, cliente, servico, numero='OS-001', status='pendente', faturada=False, **kwargs):
    dados = {
        'numero': numero,
        'cliente': cliente,
        'servico': servico,
        'status': status,
        'prazo_entrega': date.today() + timedelta(days=7),
        'usuario_criacao': usuario,
        'valor': 100.00,
        'valor_metro': 50.00,
        'faturada': faturada,
    }
    dados.update(kwargs)
    return OrdemServico.objects.create(**dados)


class OrdemServicoListCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()
        autenticar(self.client)
        self.cliente = criar_cliente()
        self.servico = criar_servico()

    def test_listar_os_sem_autenticacao(self):
        self.client.credentials()
        response = self.client.get('/api/ordens-servico/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def _resultados(self, response):
        """Extrai lista de resultados seja paginado ou não."""
        data = response.data
        return data.get('results', data) if isinstance(data, dict) else data

    def test_listar_os_dashboard_exclui_faturadas(self):
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-001', faturada=False)
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-002', faturada=True)
        response = self.client.get('/api/ordens-servico/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numeros = [os['numero'] for os in self._resultados(response)]
        self.assertIn('OS-001', numeros)
        self.assertNotIn('OS-002', numeros)

    def test_listar_os_historico_inclui_faturadas(self):
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-001', faturada=False)
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-002', faturada=True)
        response = self.client.get('/api/ordens-servico/?historico=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numeros = [os['numero'] for os in self._resultados(response)]
        self.assertIn('OS-001', numeros)
        self.assertIn('OS-002', numeros)

    def test_filtrar_por_status(self):
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-001', status='pendente')
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-002', status='finalizada')
        response = self.client.get('/api/ordens-servico/?status=pendente')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = [os['status'] for os in self._resultados(response)]
        self.assertTrue(all(s == 'pendente' for s in statuses))

    def test_criar_os_valida(self):
        # O serializer usa cliente_id (PrimaryKeyRelatedField) para escrita
        response = self.client.post('/api/ordens-servico/', {
            'numero': 'OS-100',
            'cliente_id': self.cliente.id,
            'servico': self.servico.id,
            'status': 'pendente',
            'prazo_entrega': str(date.today() + timedelta(days=5)),
            'valor': '150.00',
            'valor_metro': '75.00',
            'estado_cabelo': 'novo',
            'tipo_cabelo': 'liso',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['numero'], 'OS-100')
        self.assertTrue(OrdemServico.objects.filter(numero='OS-100').exists())

    def test_criar_os_sem_cliente(self):
        response = self.client.post('/api/ordens-servico/', {
            'numero': 'OS-101',
            'status': 'pendente',
            'prazo_entrega': str(date.today() + timedelta(days=5)),
            'valor': '100.00',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_criar_os_numero_duplicado(self):
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-DUP')
        response = self.client.post('/api/ordens-servico/', {
            'numero': 'OS-DUP',
            'cliente': self.cliente.id,
            'prazo_entrega': str(date.today() + timedelta(days=5)),
            'valor': '100.00',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_gerar_numero_os(self):
        response = self.client.get('/api/ordens-servico/gerar-numero/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('numero', response.data)


class OrdemServicoDetailTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()
        autenticar(self.client)
        self.cliente = criar_cliente()
        self.servico = criar_servico()
        self.os = criar_os(self.usuario, self.cliente, self.servico, numero='OS-DET')

    def test_obter_os(self):
        response = self.client.get(f'/api/ordens-servico/{self.os.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['numero'], 'OS-DET')

    def test_atualizar_status_os(self):
        response = self.client.patch(f'/api/ordens-servico/{self.os.id}/', {
            'status': 'em_desenvolvimento',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertEqual(self.os.status, 'em_desenvolvimento')

    def test_atualizar_status_invalido(self):
        response = self.client.patch(f'/api/ordens-servico/{self.os.id}/', {
            'status': 'status_invalido',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_os_nao_encontrada(self):
        response = self.client.get('/api/ordens-servico/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FaturarOSTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Faturar exige is_staff=True
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        autenticar(self.client, email='admin@barra.com')
        self.cliente = criar_cliente()
        self.servico = criar_servico()
        self.os = criar_os(
            self.admin, self.cliente, self.servico,
            numero='OS-FAT', status='finalizada', faturada=False,
            entregue=True, forma_pagamento='pix',
        )

    def test_faturar_os(self):
        response = self.client.post(f'/api/ordens-servico/{self.os.id}/faturar/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertTrue(self.os.faturada)
        self.assertIsNotNone(self.os.data_faturamento)

    def test_faturar_os_sem_permissao(self):
        criar_usuario(email='func@barra.com', is_staff=False)
        self.client.credentials()
        autenticar(self.client, email='func@barra.com')
        response = self.client.post(f'/api/ordens-servico/{self.os.id}/faturar/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_desfaturar_os(self):
        self.os.faturada = True
        self.os.data_faturamento = timezone.now()
        self.os.save()

        response = self.client.post(f'/api/ordens-servico/{self.os.id}/desfaturar/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertFalse(self.os.faturada)
        self.assertIsNone(self.os.data_faturamento)

    def test_faturar_os_ja_faturada(self):
        self.os.faturada = True
        self.os.data_faturamento = timezone.now()
        self.os.save()

        # A OS faturada ainda pode ser acessada pelo endpoint faturar (via get_queryset excluindo faturadas = 404)
        # mas o desfaturar usa get_object_or_404 diretamente
        response = self.client.post(f'/api/ordens-servico/{self.os.id}/faturar/')
        # Queryset exclui faturadas, então retorna 404
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])


class GerarNumeroOSTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()
        autenticar(self.client)
        self.cliente = criar_cliente()
        self.servico = criar_servico()

    def test_gerar_numero_sem_os_existente(self):
        response = self.client.get('/api/ordens-servico/gerar-numero/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('numero', response.data)

    def test_gerar_numero_sequencial(self):
        criar_os(self.usuario, self.cliente, self.servico, numero='OS-005')
        response = self.client.get('/api/ordens-servico/gerar-numero/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numero = response.data['numero']
        num = int(numero.split('-')[-1])
        self.assertGreater(num, 5)


class CancelarOSTest(TestCase):
    """Testa o soft delete — destroy deve marcar status como 'cancelada'."""

    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        self.funcionario = criar_usuario(email='func@barra.com', is_staff=False)
        self.cliente = criar_cliente()
        self.servico = criar_servico()
        self.os = criar_os(self.admin, self.cliente, self.servico, numero='OS-CANCEL')

    def _auth(self, email):
        autenticar(self.client, email=email)

    def test_cancelar_os_admin_marca_status_cancelada(self):
        self._auth('admin@barra.com')
        response = self.client.delete(f'/api/ordens-servico/{self.os.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.os.refresh_from_db()
        self.assertEqual(self.os.status, 'cancelada')
        # Registro ainda existe no banco
        self.assertTrue(OrdemServico.objects.filter(id=self.os.id).exists())

    def test_cancelar_os_funcionario_negado(self):
        self._auth('func@barra.com')
        response = self.client.delete(f'/api/ordens-servico/{self.os.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.os.refresh_from_db()
        self.assertNotEqual(self.os.status, 'cancelada')

    def test_canceladas_excluidas_do_dashboard(self):
        self._auth('admin@barra.com')
        os_normal = criar_os(self.admin, self.cliente, self.servico, numero='OS-NORM')
        os_cancelada = criar_os(self.admin, self.cliente, self.servico, numero='OS-CAN2', status='cancelada')
        response = self.client.get('/api/ordens-servico/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numeros = [o['numero'] for o in response.data]
        self.assertIn('OS-NORM', numeros)
        self.assertNotIn('OS-CAN2', numeros)

    def test_canceladas_excluidas_do_historico(self):
        self._auth('admin@barra.com')
        os_normal = criar_os(self.admin, self.cliente, self.servico, numero='OS-HIST', faturada=True)
        os_cancelada = criar_os(self.admin, self.cliente, self.servico, numero='OS-CANHIST', status='cancelada')
        response = self.client.get('/api/ordens-servico/?historico=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numeros = [o['numero'] for o in response.data]
        self.assertIn('OS-HIST', numeros)
        self.assertNotIn('OS-CANHIST', numeros)

    def test_endpoint_canceladas_retorna_apenas_canceladas(self):
        self._auth('admin@barra.com')
        criar_os(self.admin, self.cliente, self.servico, numero='OS-ATIVA')
        criar_os(self.admin, self.cliente, self.servico, numero='OS-CANX', status='cancelada')
        response = self.client.get('/api/ordens-servico/?canceladas=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numeros = [o['numero'] for o in response.data]
        self.assertIn('OS-CANX', numeros)
        self.assertNotIn('OS-ATIVA', numeros)
