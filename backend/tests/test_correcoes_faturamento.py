from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Usuario
from apps.faturamento.models import ConfiguracaoEmpresa
from apps.ordens_servico.models import AlteracaoOS, Cliente, OrdemServico, Servico


def criar_usuario(email, is_staff=False):
    return Usuario.objects.create_user(
        username=email, email=email, password='senha123',
        nome_completo='Patrão Teste' if is_staff else 'Func Teste', is_staff=is_staff,
    )


def autenticar(client, email):
    response = client.post('/api/auth/login/', {'email': email, 'password': 'senha123'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")


class Base(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patrao = criar_usuario('patrao@barra.com', is_staff=True)
        self.funcionario = criar_usuario('func@barra.com')
        config = ConfiguracaoEmpresa.get()
        config.pin_faturamento = '4321'
        config.save()
        self.cliente = Cliente.objects.create(nome='Salão A', telefone='31999990000')
        self.servico = Servico.objects.create(nome='1 peça')
        self.data_faturamento = timezone.now()
        self.os = self.criar_faturada()
        autenticar(self.client, 'patrao@barra.com')

    def criar_faturada(self, **kwargs):
        dados = {
            'numero': f'OS-C{OrdemServico.objects.count() + 1:03d}', 'cliente': self.cliente, 'servico': self.servico,
            'status': 'finalizada', 'entregue': True, 'faturada': True,
            'data_finalizacao': self.data_faturamento, 'data_faturamento': self.data_faturamento,
            'prazo_entrega': self.data_faturamento, 'usuario_criacao': self.patrao,
            'valor': Decimal('100.00'), 'valor_metro': Decimal('50.00'),
            'forma_pagamento': 'dinheiro', 'valor_recebido': Decimal('120.00'),
        }
        dados.update(kwargs)
        return OrdemServico.objects.create(**dados)

    def post(self, acao, dados, ordem=None):
        ordem = ordem or self.os
        return self.client.post(f'/api/ordens-servico/{ordem.id}/{acao}/', dados, format='json')


class CorrigirPagamentoTest(Base):
    def test_troca_dinheiro_por_pix(self):
        response = self.post('corrigir-pagamento', {'pin': '4321', 'motivo': 'Lançado errado no balcão', 'forma_pagamento': 'pix'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertEqual((self.os.forma_pagamento, self.os.valor_recebido), ('pix', None))
        # Continua faturada, no mesmo dia do Caixa
        self.assertTrue(self.os.faturada)
        self.assertEqual(self.os.data_faturamento, self.data_faturamento)

        alteracao = AlteracaoOS.objects.get(ordem_servico=self.os)
        self.assertEqual(alteracao.acao, 'corrigir_pagamento')
        self.assertEqual(alteracao.usuario, self.patrao)
        self.assertEqual(alteracao.motivo, 'Lançado errado no balcão')
        self.assertEqual(alteracao.dados_antes['forma_pagamento'], 'dinheiro')
        self.assertEqual(alteracao.dados_antes['valor_recebido'], '120.00')
        self.assertEqual(alteracao.dados_depois['forma_pagamento'], 'pix')

    def test_pagamento_dividido_calcula_segunda_parte(self):
        response = self.post('corrigir-pagamento', {
            'pin': '4321', 'motivo': 'Cliente pagou metade no cartão',
            'forma_pagamento': 'dinheiro', 'forma_pagamento_2': 'cartao_debito', 'valor_pagamento_1': '40', 'valor_recebido': '50',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertEqual((self.os.valor_pagamento_1, self.os.valor_pagamento_2), (Decimal('40.00'), Decimal('60.00')))
        self.assertEqual(response.data['ordem']['troco'], 10.0)

    def test_nao_altera_valor_total(self):
        self.post('corrigir-pagamento', {'pin': '4321', 'motivo': 'Ajuste', 'forma_pagamento': 'pix', 'valor': '80'})
        self.os.refresh_from_db()
        self.assertEqual(self.os.valor, Decimal('100.00'))

    def test_validacoes(self):
        casos = [
            ({'forma_pagamento': 'pix', 'forma_pagamento_2': 'pix', 'valor_pagamento_1': '10'}, 'diferentes'),
            ({'forma_pagamento': 'pix', 'forma_pagamento_2': 'dinheiro', 'valor_pagamento_1': '100'}, 'primeira forma'),
            ({'forma_pagamento': 'dinheiro', 'valor_recebido': '90'}, 'menor que o valor'),
            ({'forma_pagamento': 'boleto'}, 'inválida'),
            ({'forma_pagamento': ''}, 'Escolha a forma'),
            ({'forma_pagamento': 'dinheiro', 'valor_recebido': '120'}, 'igual ao atual'),
        ]
        for extra, trecho in casos:
            with self.subTest(extra=extra):
                response = self.post('corrigir-pagamento', {'pin': '4321', 'motivo': 'Teste', **extra})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(trecho, response.data['error'])
        self.assertFalse(AlteracaoOS.objects.exists())

    def test_parceiro_pode_voltar_para_conta(self):
        parceiro = Cliente.objects.create(nome='Parceiro', telefone='1', eh_parceiro=True)
        ordem = self.criar_faturada(cliente=parceiro)
        response = self.post('corrigir-pagamento', {'pin': '4321', 'motivo': 'Vai para a conta', 'forma_pagamento': ''}, ordem)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertIsNone(ordem.forma_pagamento)


class SegurancaTest(Base):
    def test_pin_errado_ou_ausente(self):
        for pin in ('0000', '', None):
            with self.subTest(pin=pin):
                response = self.post('estornar-faturamento', {'pin': pin, 'motivo': 'Teste'})
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(response.data['error'], 'PIN incorreto.')
        self.os.refresh_from_db()
        self.assertTrue(self.os.faturada)

    def test_sem_pin_cadastrado_nao_pede_pin(self):
        ConfiguracaoEmpresa.objects.update(pin_faturamento='')
        response = self.post('estornar-faturamento', {'motivo': 'Empresa sem PIN'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_motivo_obrigatorio(self):
        response = self.post('cancelar-faturada', {'pin': '4321', 'motivo': '  '})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['campo'], 'motivo')

    def test_funcionario_nao_corrige(self):
        autenticar(self.client, 'func@barra.com')
        for acao in ('corrigir-pagamento', 'estornar-faturamento', 'cancelar-faturada'):
            with self.subTest(acao=acao):
                response = self.post(acao, {'pin': '4321', 'motivo': 'Teste', 'forma_pagamento': 'pix'})
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(f'/api/ordens-servico/{self.os.id}/alteracoes/').status_code, status.HTTP_403_FORBIDDEN)

    def test_os_nao_faturada(self):
        aberta = self.criar_faturada(faturada=False, data_faturamento=None)
        response = self.post('estornar-faturamento', {'pin': '4321', 'motivo': 'Teste'}, aberta)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('não está faturada', response.data['error'])


class EstornarECancelarTest(Base):
    def test_estorno_volta_para_o_dashboard_sem_pagamento(self):
        response = self.post('estornar-faturamento', {'pin': '4321', 'motivo': 'Valor total errado'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertEqual((self.os.faturada, self.os.data_faturamento, self.os.status), (False, None, 'finalizada'))
        self.assertEqual((self.os.forma_pagamento, self.os.valor_recebido), (None, None))

        numeros = [o['numero'] for o in self.client.get('/api/ordens-servico/').data]
        self.assertIn(self.os.numero, numeros)
        # Pode ser faturada de novo pelo fluxo normal
        self.os.forma_pagamento = 'pix'
        self.os.save()
        self.assertEqual(self.client.post(f'/api/ordens-servico/{self.os.id}/faturar/').status_code, status.HTTP_200_OK)

    def test_cancelar_faturada(self):
        response = self.post('cancelar-faturada', {'pin': '4321', 'motivo': 'Cliente desistiu do serviço'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os.refresh_from_db()
        self.assertEqual((self.os.status, self.os.faturada, self.os.forma_pagamento), ('cancelada', False, None))
        self.assertIn('Cliente desistiu do serviço', self.os.observacoes)

        caixa = self.client.get('/api/faturamento/faturados-no-dia/', {'data': timezone.localdate().isoformat()}).data
        self.assertEqual(caixa['quantidade'], 0)
        faturamento = self.client.get('/api/faturamento/').data
        self.assertEqual(faturamento['faturamento_total'], 0)

    def test_historico_de_alteracoes(self):
        self.post('corrigir-pagamento', {'pin': '4321', 'motivo': 'Era PIX', 'forma_pagamento': 'pix'})
        self.post('estornar-faturamento', {'pin': '4321', 'motivo': 'Refaturar com valor certo'})
        response = self.client.get(f'/api/ordens-servico/{self.os.id}/alteracoes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([a['acao'] for a in response.data], ['estornar_faturamento', 'corrigir_pagamento'])
        self.assertEqual(response.data[0]['acao_label'], 'Faturamento estornado')
        self.assertEqual(response.data[0]['usuario_nome'], 'Patrão Teste')

    def test_desfaturar_sem_registro_nao_existe_mais(self):
        response = self.client.post(f'/api/ordens-servico/{self.os.id}/desfaturar/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
