from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
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


def criar_parceiro(nome='Parceiro Teste'):
    return Cliente.objects.create(nome=nome, telefone='31999990000', eh_parceiro=True)


def criar_os_debito(usuario, parceiro, numero='OS-D001', forma_pagamento=None):
    servico, _ = Servico.objects.get_or_create(nome='Serviço Debito')
    return OrdemServico.objects.create(
        numero=numero,
        cliente=parceiro,
        servico=servico,
        status='finalizada',
        prazo_entrega=date.today() + timedelta(days=7),
        usuario_criacao=usuario,
        valor=200.00,
        valor_metro=100.00,
        forma_pagamento=forma_pagamento,
    )


class DebitoListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        autenticar(self.client, 'admin@barra.com')
        self.parceiro = criar_parceiro()
        self.nao_parceiro = Cliente.objects.create(nome='Nao Parceiro', telefone='31000000001', eh_parceiro=False)

    def test_lista_apenas_os_de_parceiros_sem_pagamento(self):
        criar_os_debito(self.admin, self.parceiro, numero='OS-PAR')
        servico, _ = Servico.objects.get_or_create(nome='Serv')
        OrdemServico.objects.create(
            numero='OS-NAO', cliente=self.nao_parceiro, servico=servico,
            status='finalizada', prazo_entrega=date.today(), usuario_criacao=self.admin,
            valor=100.00, valor_metro=50.00,
        )
        response = self.client.get('/api/debitos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        numeros = [o['numero'] for o in response.data]
        self.assertIn('OS-PAR', numeros)
        self.assertNotIn('OS-NAO', numeros)

    def test_os_parceiro_ja_paga_nao_aparece_na_lista(self):
        criar_os_debito(self.admin, self.parceiro, numero='OS-PAGA', forma_pagamento='pix')
        criar_os_debito(self.admin, self.parceiro, numero='OS-PEND')
        response = self.client.get('/api/debitos/')
        numeros = [o['numero'] for o in response.data]
        self.assertNotIn('OS-PAGA', numeros)
        self.assertIn('OS-PEND', numeros)

    def test_filtro_por_parceiro_id(self):
        outro_parceiro = criar_parceiro(nome='Outro Parceiro')
        criar_os_debito(self.admin, self.parceiro, numero='OS-P1')
        criar_os_debito(self.admin, outro_parceiro, numero='OS-P2')
        response = self.client.get(f'/api/debitos/?parceiro_id={self.parceiro.id}')
        numeros = [o['numero'] for o in response.data]
        self.assertIn('OS-P1', numeros)
        self.assertNotIn('OS-P2', numeros)

    def test_sem_autenticacao_retorna_401(self):
        self.client.credentials()
        response = self.client.get('/api/debitos/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MarcarPagoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        autenticar(self.client, 'admin@barra.com')
        self.parceiro = criar_parceiro()
        self.debito = criar_os_debito(self.admin, self.parceiro, numero='OS-MP01')

    def test_marcar_pago_com_pix(self):
        response = self.client.patch(
            f'/api/debitos/{self.debito.id}/marcar-pago/',
            {'forma_pagamento': 'pix'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.debito.refresh_from_db()
        self.assertEqual(self.debito.forma_pagamento, 'pix')

    def test_marcar_pago_com_dinheiro(self):
        response = self.client.patch(
            f'/api/debitos/{self.debito.id}/marcar-pago/',
            {'forma_pagamento': 'dinheiro'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.debito.refresh_from_db()
        self.assertEqual(self.debito.forma_pagamento, 'dinheiro')

    def test_marcar_pago_sem_forma_pagamento_retorna_400(self):
        response = self.client.patch(
            f'/api/debitos/{self.debito.id}/marcar-pago/',
            {}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('erro', response.data)

    def test_marcar_pago_forma_invalida_retorna_400(self):
        response = self.client.patch(
            f'/api/debitos/{self.debito.id}/marcar-pago/',
            {'forma_pagamento': 'cheque'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_marcar_pago_url_com_underscore_retorna_404(self):
        """Garante que a URL correta usa hífen, não underscore."""
        response = self.client.patch(
            f'/api/debitos/{self.debito.id}/marcar_pago/',
            {'forma_pagamento': 'pix'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_marcar_pago_sem_autenticacao_retorna_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'/api/debitos/{self.debito.id}/marcar-pago/',
            {'forma_pagamento': 'pix'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ReverterPagamentoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        self.funcionario = criar_usuario(email='func@barra.com', is_staff=False)
        self.parceiro = criar_parceiro()
        self.debito_pago = criar_os_debito(
            self.admin, self.parceiro, numero='OS-REV01', forma_pagamento='dinheiro'
        )

    def _auth(self, email):
        autenticar(self.client, email)

    def test_reverter_pagamento_admin(self):
        self._auth('admin@barra.com')
        response = self.client.patch(f'/api/debitos/{self.debito_pago.id}/reverter-pagamento/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.debito_pago.refresh_from_db()
        self.assertIsNone(self.debito_pago.forma_pagamento)

    def test_reverter_pagamento_funcionario_negado(self):
        self._auth('func@barra.com')
        response = self.client.patch(f'/api/debitos/{self.debito_pago.id}/reverter-pagamento/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.debito_pago.refresh_from_db()
        self.assertEqual(self.debito_pago.forma_pagamento, 'dinheiro')

    def test_reverter_pagamento_url_com_underscore_retorna_404(self):
        self._auth('admin@barra.com')
        response = self.client.patch(f'/api/debitos/{self.debito_pago.id}/reverter_pagamento/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reverter_os_nao_paga_ainda_funciona(self):
        """get_queryset das actions inclui qualquer OS de parceiro."""
        self._auth('admin@barra.com')
        debito_pendente = criar_os_debito(self.admin, self.parceiro, numero='OS-REV02')
        response = self.client.patch(f'/api/debitos/{debito_pendente.id}/reverter-pagamento/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
