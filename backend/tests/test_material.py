from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Usuario
from apps.faturamento.models import SaidaCaixa
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
        self.funcionario = criar_usuario('func@barra.com')
        self.cliente = Cliente.objects.create(nome='Salão A', telefone='31999990000')
        self.servico = Servico.objects.create(nome='1 peça')
        self.duplo = Servico.objects.create(nome='Tecer e dobrar/Duplo')
        self.seq = 0

    def criar_os(self, **kwargs):
        self.seq += 1
        dados = {
            'numero': f'OS-M{self.seq:03d}',
            'cliente': self.cliente,
            'servico': self.servico,
            'status': 'pendente',
            'prazo_entrega': timezone.now() + timedelta(days=2),
            'usuario_criacao': self.patrao,
            'valor': Decimal('100.00'),
            'valor_metro': Decimal('50.00'),
            'peso_gramas': 200,
            'tamanho_cabelo_cm': 45,
        }
        dados.update(kwargs)
        return OrdemServico.objects.create(**dados)

    def finalizada(self, peso_final=None, **kwargs):
        return self.criar_os(status='finalizada', data_finalizacao=timezone.now(), peso_final_gramas=peso_final, **kwargs)


class FinalizarComPesoTest(Base):
    def setUp(self):
        super().setUp()
        autenticar(self.client, 'func@barra.com')

    def finalizar(self, ordem, **extra):
        return self.client.patch(
            f'/api/ordens-servico/{ordem.id}/atualizar-status/',
            {'status': 'finalizada', **extra}, format='json',
        )

    def test_os_nova_exige_peso_final(self):
        ordem = self.criar_os(status='em_desenvolvimento')
        response = self.finalizar(ordem)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('peso final', response.data['error'])
        ordem.refresh_from_db()
        self.assertEqual(ordem.status, 'em_desenvolvimento')

    def test_finaliza_gravando_peso_e_tamanho(self):
        ordem = self.criar_os(status='em_desenvolvimento')
        response = self.finalizar(ordem, peso_final_gramas=168, tamanho_final_cm=38)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['perda_percentual'], 16.0)
        ordem.refresh_from_db()
        self.assertEqual((ordem.status, ordem.peso_final_gramas, ordem.tamanho_final_cm), ('finalizada', 168, 38))
        self.assertIsNotNone(ordem.data_finalizacao)

    def test_peso_final_maior_que_entrada_e_recusado(self):
        ordem = self.criar_os(status='em_desenvolvimento')
        response = self.finalizar(ordem, peso_final_gramas=250)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('200 g', response.data['error'])

    def test_os_antiga_pode_informar_depois(self):
        ordem = self.criar_os(status='em_desenvolvimento', exige_peso_final=False)
        response = self.finalizar(ordem)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertEqual(ordem.status, 'finalizada')
        self.assertIsNone(ordem.peso_final_gramas)

    def test_edicao_nao_finaliza_sem_peso(self):
        autenticar(self.client, 'patrao@barra.com')
        ordem = self.criar_os(status='em_desenvolvimento')
        response = self.client.patch(f'/api/ordens-servico/{ordem.id}/', {'status': 'finalizada'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('peso_final_gramas', response.data)

    def test_informar_peso_depois_na_edicao(self):
        autenticar(self.client, 'patrao@barra.com')
        ordem = self.finalizada(exige_peso_final=False)
        response = self.client.patch(f'/api/ordens-servico/{ordem.id}/', {'peso_final_gramas': 150}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['perda_percentual'], 25.0)


class OrigemCabeloTest(Base):
    def setUp(self):
        super().setUp()
        autenticar(self.client, 'patrao@barra.com')

    def test_cabelo_nosso_exige_custo(self):
        ordem = self.criar_os()
        response = self.client.patch(f'/api/ordens-servico/{ordem.id}/', {'origem_cabelo': 'proprio'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('custo_cabelo', response.data)

    def test_voltar_para_cliente_limpa_custo(self):
        ordem = self.criar_os(origem_cabelo='proprio', custo_cabelo=Decimal('180'))
        response = self.client.patch(f'/api/ordens-servico/{ordem.id}/', {'origem_cabelo': 'cliente'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertIsNone(ordem.custo_cabelo)


class TipoMaterialTest(Base):
    def setUp(self):
        super().setUp()
        autenticar(self.client, 'func@barra.com')

    def criar_saida(self, **dados):
        payload = {'tipo': 'saida', 'descricao': 'Compra', 'valor': '86.00', 'data': date.today().isoformat(), **dados}
        return self.client.post('/api/faturamento/saidas-caixa/', payload, format='json')

    def test_material_exige_tipo(self):
        response = self.criar_saida(categoria='material')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tipo_material', response.data)

    def test_material_com_tipo(self):
        response = self.criar_saida(categoria='material', tipo_material='linha')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tipo_material'], 'linha')

    def test_outras_categorias_ignoram_tipo(self):
        response = self.criar_saida(categoria='aluguel', tipo_material='linha')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tipo_material'], '')


class PainelMaterialTest(Base):
    url = '/api/faturamento/material/'

    def test_funcionario_nao_acessa(self):
        autenticar(self.client, 'func@barra.com')
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

    def test_sem_login_nao_acessa(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_indicadores(self):
        autenticar(self.client, 'patrao@barra.com')
        # Perdas: 400 g -> 300 g (25%, acima) e 100 g -> 90 g (10%)
        self.finalizada(peso_final=300, peso_gramas=400, servico=self.duplo)
        self.finalizada(peso_final=90, peso_gramas=100)
        # Limpeza: 200 g -> 110 g = 45% (acima dos 40%)
        self.finalizada(peso_final=110, limpeza_mesclagem=True)
        # Sem peso final (OS antiga)
        self.finalizada(exige_peso_final=False)
        # Cabelo nosso: custo R$ 200, 200 g -> 150 g = 25% -> prejuízo R$ 50
        self.finalizada(peso_final=150, origem_cabelo='proprio', custo_cabelo=Decimal('200'))
        # Faturada no período
        self.finalizada(peso_final=180, faturada=True, valor=Decimal('500'))
        # Cancelada não entra
        self.criar_os(status='cancelada', peso_gramas=999)

        SaidaCaixa.objects.create(tipo='saida', descricao='Linha', valor=Decimal('30'), categoria='material', tipo_material='linha', data=date.today())
        SaidaCaixa.objects.create(tipo='saida', descricao='Cola', valor=Decimal('10'), categoria='material', tipo_material='cola', data=date.today())
        SaidaCaixa.objects.create(tipo='saida', descricao='Lanche', valor=Decimal('15'), categoria='outro', data=date.today())

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dados = response.data
        resumo = dados['resumo']

        # 400 + 100 + 200 + 200 + 200 + 200 = 1300 g em 6 OS
        self.assertEqual(resumo['gramas_recebidas'], 1300)
        self.assertEqual(resumo['os_recebidas'], 6)
        # Sem limpeza: entradas 400+100+200+200 = 900, perdido 100+10+50+20 = 180 -> 20%
        self.assertEqual(resumo['perda_media'], 20.0)
        self.assertEqual(resumo['perda_media_limpeza'], 45.0)
        self.assertEqual(resumo['os_sem_peso_final'], 1)
        self.assertEqual(resumo['gasto_material'], 40.0)
        self.assertEqual(resumo['material_por_100g'], round(40 / 1300 * 100, 2))
        self.assertEqual(resumo['faturamento'], 500.0)
        self.assertEqual(resumo['material_pct_faturamento'], 8.0)

        acima = dados['perdas']['acima_do_esperado']
        self.assertEqual([a['perda'] for a in acima], [45.0, 25.0, 25.0])
        self.assertEqual(acima[0]['esperado'], 40)
        self.assertEqual(dados['perdas']['por_servico'][0], {
            'nome': 'Tecer e dobrar/Duplo', 'perda': 25.0, 'os': 1, 'gramas_entrada': 400, 'gramas_perdidas': 100,
        })
        self.assertEqual(len(dados['perdas']['sem_peso_final']), 1)

        self.assertEqual([t['tipo'] for t in dados['custo']['por_tipo']], ['linha', 'cola'])
        self.assertEqual(dados['custo']['saidas_outro'], {'quantidade': 1, 'valor': 15.0})
        proprio = dados['custo']['cabelo_proprio']
        self.assertEqual((proprio['os'], proprio['custo'], proprio['prejuizo_estimado']), (1, 200.0, 50.0))

    def test_periodo_invalido(self):
        autenticar(self.client, 'patrao@barra.com')
        response = self.client.get(self.url, {'data_inicio': '2026-09-10', 'data_fim': '2026-09-01'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_periodo_filtra(self):
        autenticar(self.client, 'patrao@barra.com')
        self.finalizada(peso_final=150)
        ontem = (timezone.localdate() - timedelta(days=30)).isoformat()
        response = self.client.get(self.url, {'data_inicio': ontem, 'data_fim': ontem})
        self.assertEqual(response.data['resumo']['os_recebidas'], 0)
        self.assertIsNone(response.data['resumo']['perda_media'])
