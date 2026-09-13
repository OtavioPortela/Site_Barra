from datetime import datetime, timedelta, timezone as dt_timezone
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Usuario
from apps.ordens_servico import notas_debito
from apps.ordens_servico.models import Cliente, OrdemServico, Servico


def criar_usuario(email, is_staff=False):
    return Usuario.objects.create_user(
        username=email, email=email, password='senha123',
        nome_completo='Usuario Teste', is_staff=is_staff,
    )


def autenticar(client, email):
    response = client.post('/api/auth/login/', {'email': email, 'password': 'senha123'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")


class Base(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patrao = criar_usuario('patrao@barra.com', is_staff=True)
        self.cliente = Cliente.objects.create(nome='Salão A', telefone='31999990000')
        self.servico = Servico.objects.create(nome='1 peça')
        self.seq = 0

    def criar_os(self, **kwargs):
        self.seq += 1
        agora = timezone.now()
        dados = {
            'numero': f'OS-F{self.seq:03d}', 'cliente': self.cliente, 'servico': self.servico,
            'status': 'finalizada', 'entregue': True, 'data_finalizacao': agora,
            'prazo_entrega': agora, 'usuario_criacao': self.patrao,
            'valor': Decimal('100.00'), 'valor_metro': Decimal('50.00'),
            'peso_gramas': 200, 'tamanho_cabelo_cm': 45,
        }
        dados.update(kwargs)
        return OrdemServico.objects.create(**dados)

    def faturada(self, **kwargs):
        dados = {'faturada': True, 'data_faturamento': timezone.now(), 'forma_pagamento': 'dinheiro', **kwargs}
        return self.criar_os(**dados)


class OSFaturadaTravadaTest(Base):
    def setUp(self):
        super().setUp()
        autenticar(self.client, 'patrao@barra.com')
        self.os = self.faturada()

    def url(self, sufixo=''):
        return f'/api/ordens-servico/{self.os.id}/{sufixo}?historico=1'

    def test_nao_edita_valor(self):
        response = self.client.patch(self.url(), {'valor': 80}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('já foi faturada', response.data['error'])
        self.os.refresh_from_db()
        self.assertEqual(self.os.valor, Decimal('100.00'))

    def test_nao_edita_pagamento(self):
        response = self.client.patch(self.url(), {'forma_pagamento': 'pix', 'valor_recebido': 80}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.os.refresh_from_db()
        self.assertEqual(self.os.forma_pagamento, 'dinheiro')

    def test_nao_muda_status(self):
        response = self.client.patch(self.url('atualizar-status/'), {'status': 'em_desenvolvimento'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.os.refresh_from_db()
        self.assertEqual((self.os.status, self.os.faturada), ('finalizada', True))

    def test_nao_cancela(self):
        response = self.client.delete(f'/api/ordens-servico/{self.os.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('não pode ser cancelada', response.data['error'])
        self.os.refresh_from_db()
        self.assertEqual(self.os.status, 'finalizada')

    def test_ainda_informa_peso_final(self):
        # Medidas do controle de perdas não mexem em dinheiro e seguem editáveis (painel Material)
        response = self.client.patch(self.url(), {'peso_final_gramas': 160, 'tamanho_final_cm': 40}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['perda_percentual'], 20.0)

    def test_os_nao_faturada_continua_editavel_e_cancelavel(self):
        aberta = self.criar_os()
        self.assertEqual(self.client.patch(f'/api/ordens-servico/{aberta.id}/', {'valor': 90}, format='json').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.delete(f'/api/ordens-servico/{aberta.id}/').status_code, status.HTTP_204_NO_CONTENT)


class CaixaDoDiaTest(Base):
    url = '/api/faturamento/faturados-no-dia/'

    def setUp(self):
        super().setUp()
        autenticar(self.client, 'patrao@barra.com')

    def test_cancelada_nao_entra_no_caixa(self):
        self.faturada(valor=Decimal('100'))
        # Cancelamentos antigos (feitos antes da trava) não podem continuar somando
        self.faturada(valor=Decimal('50'), status='cancelada')
        hoje = timezone.localdate().isoformat()
        response = self.client.get(self.url, {'data': hoje})
        self.assertEqual(response.data['total'], 100.0)
        self.assertEqual(response.data['quantidade'], 1)

    def test_hoje_e_o_dia_de_brasilia_depois_das_21h(self):
        # 12/09 às 23h30 em Brasília = 13/09 às 02h30 em UTC
        noite = datetime(2026, 9, 13, 2, 30, tzinfo=dt_timezone.utc)
        self.faturada(valor=Decimal('70'), data_faturamento=noite)
        with patch('django.utils.timezone.now', return_value=noite):
            response = self.client.get(self.url)
        self.assertEqual(response.data['data'], '2026-09-12')
        self.assertEqual(response.data['total'], 70.0)


class DebitosSemCanceladasTest(Base):
    def setUp(self):
        super().setUp()
        autenticar(self.client, 'patrao@barra.com')
        self.parceiro = Cliente.objects.create(nome='Parceiro X', telefone='31988887777', eh_parceiro=True)
        self.devida = self.criar_os(cliente=self.parceiro, faturada=True, data_faturamento=timezone.now())
        self.cancelada = self.criar_os(cliente=self.parceiro, status='cancelada', faturada=True, data_faturamento=timezone.now() - timedelta(days=1))

    def test_lista_de_debitos_ignora_canceladas(self):
        response = self.client.get('/api/debitos/', {'parceiro_id': self.parceiro.id})
        dados = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual([d['id'] for d in dados], [self.devida.id])

    def test_nota_enviada_ao_parceiro_ignora_canceladas(self):
        self.assertEqual(list(notas_debito.buscar_debitos(self.parceiro)), [self.devida])
