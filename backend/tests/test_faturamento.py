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


def autenticar(client, email, password='senha123'):
    response = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


def criar_os_faturada(usuario, valor=200.00):
    cliente = Cliente.objects.create(nome=f'Cliente Fat {Cliente.objects.count()}', telefone='31999990000')
    servico, _ = Servico.objects.get_or_create(nome='Serviço Fat')
    os = OrdemServico.objects.create(
        numero=f'OS-F{OrdemServico.objects.count() + 1}',
        cliente=cliente,
        servico=servico,
        status='finalizada',
        faturada=True,
        data_finalizacao=timezone.now(),
        prazo_entrega=date.today(),
        usuario_criacao=usuario,
        valor=valor,
        valor_metro=valor / 2,
    )
    return os


class DashboardFaturamentoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        self.func = criar_usuario(email='func@barra.com', is_staff=False)

    def test_dashboard_sem_autenticacao(self):
        response = self.client.get('/api/faturamento/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_sem_permissao_staff(self):
        autenticar(self.client, 'func@barra.com')
        response = self.client.get('/api/faturamento/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_admin_retorna_estrutura_correta(self):
        autenticar(self.client, 'admin@barra.com')
        response = self.client.get('/api/faturamento/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        campos_esperados = [
            'faturamento_total', 'faturamento_mensal', 'faturamento_semanal',
            'quantidade_finalizadas', 'ticket_medio', 'faturamento_por_periodo',
            'distribuicao_status', 'top_clientes', 'ordens_finalizadas',
        ]
        for campo in campos_esperados:
            self.assertIn(campo, response.data, f"Campo '{campo}' ausente na resposta")

    def test_dashboard_sem_os_retorna_zeros(self):
        autenticar(self.client, 'admin@barra.com')
        response = self.client.get('/api/faturamento/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['faturamento_total'], 0.0)
        self.assertEqual(response.data['quantidade_finalizadas'], 0)

    def test_dashboard_com_os_faturadas(self):
        autenticar(self.client, 'admin@barra.com')
        criar_os_faturada(self.admin, valor=300.00)
        criar_os_faturada(self.admin, valor=200.00)

        response = self.client.get('/api/faturamento/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['faturamento_total'], 500.0)
        self.assertEqual(response.data['quantidade_finalizadas'], 2)

    def test_dashboard_periodo_12_meses(self):
        autenticar(self.client, 'admin@barra.com')
        response = self.client.get('/api/faturamento/')
        self.assertEqual(len(response.data['faturamento_por_periodo']), 12)

    def test_dashboard_filtro_data_inicio_invalida(self):
        autenticar(self.client, 'admin@barra.com')
        # Data inválida não deve quebrar — deve ignorar o filtro
        response = self.client.get('/api/faturamento/?data_inicio=data-invalida')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_filtro_data_valida(self):
        autenticar(self.client, 'admin@barra.com')
        criar_os_faturada(self.admin, valor=500.00)
        data_inicio = (date.today() - timedelta(days=1)).strftime('%Y-%m-%d')
        data_fim = date.today().strftime('%Y-%m-%d')
        response = self.client.get(f'/api/faturamento/?data_inicio={data_inicio}&data_fim={data_fim}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['faturamento_total'], 0)

    def test_top_clientes_ordenados_por_faturamento(self):
        autenticar(self.client, 'admin@barra.com')
        criar_os_faturada(self.admin, valor=1000.00)
        criar_os_faturada(self.admin, valor=500.00)
        response = self.client.get('/api/faturamento/')
        top = response.data['top_clientes']
        if len(top) >= 2:
            self.assertGreaterEqual(top[0]['faturamento'], top[1]['faturamento'])


class PorPeriodoFaturamentoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        autenticar(self.client, 'admin@barra.com')

    def test_por_periodo_sem_datas(self):
        response = self.client.get('/api/faturamento/por-periodo/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_por_periodo_datas_validas(self):
        data_inicio = (date.today() - timedelta(days=30)).strftime('%Y-%m-%d')
        data_fim = date.today().strftime('%Y-%m-%d')
        response = self.client.get(f'/api/faturamento/por-periodo/?data_inicio={data_inicio}&data_fim={data_fim}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('faturamento', response.data)
        self.assertIn('quantidade_os', response.data)

    def test_por_periodo_data_invalida(self):
        response = self.client.get('/api/faturamento/por-periodo/?data_inicio=invalido&data_fim=invalido')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PorClienteFaturamentoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        autenticar(self.client, 'admin@barra.com')

    def test_por_cliente_retorna_lista(self):
        response = self.client.get('/api/faturamento/por-cliente/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_por_cliente_campos_corretos(self):
        criar_os_faturada(self.admin, valor=400.00)
        response = self.client.get('/api/faturamento/por-cliente/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data:
            item = response.data[0]
            self.assertIn('cliente_id', item)
            self.assertIn('cliente_nome', item)
            self.assertIn('faturamento', item)
            self.assertIn('quantidade_os', item)
