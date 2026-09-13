from datetime import datetime, timedelta, timezone as dt_timezone
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Usuario
from apps.ordens_servico.models import Cliente, OrdemServico, Servico

# Quinta, 10/09/2026 às 15h10 em Brasília
AGORA = datetime(2026, 9, 10, 18, 10, tzinfo=dt_timezone.utc)
BRT = dt_timezone(timedelta(hours=-3))


def hora(dia, hh, mm=0):
    return datetime(2026, 9, dia, hh, mm, tzinfo=BRT)


def criar_usuario(email, nome, is_staff=False, **extra):
    return Usuario.objects.create_user(
        username=email, email=email, password='senha123', nome_completo=nome, is_staff=is_staff, **extra,
    )


class Base(TestCase):
    def setUp(self):
        self.patrao = criar_usuario('patrao@barra.com', 'Administrador', is_staff=True)
        self.caio = criar_usuario('caio@barra.com', 'Caio Souza')
        self.bruna = criar_usuario('bruna@barra.com', 'Bruna Lima')
        self.cliente = Cliente.objects.create(nome='Ouvidor Cabelos', telefone='1')
        self.servico = Servico.objects.create(nome='1 peça')
        self.seq = 0
        self.clients = {}

    def api(self, usuario):
        if usuario.email not in self.clients:
            client = APIClient()
            r = client.post('/api/auth/login/', {'email': usuario.email, 'password': 'senha123'}, format='json')
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
            self.clients[usuario.email] = client
        return self.clients[usuario.email]

    def os(self, **kwargs):
        self.seq += 1
        dados = {
            'numero': f'OS-A{self.seq:03d}', 'cliente': self.cliente, 'servico': self.servico, 'status': 'pendente',
            'prazo_entrega': hora(10, 18), 'usuario_criacao': self.bruna, 'valor': Decimal('100'), 'valor_metro': Decimal('50'),
            'peso_gramas': 200, 'tamanho_cabelo_cm': 45, 'exige_peso_final': False,
        }
        dados.update(kwargs)
        return OrdemServico.objects.create(**dados)


class ResponsavelPelaMudancaDeStatusTest(Base):
    def mover(self, usuario, ordem, novo, **extra):
        return self.api(usuario).patch(f'/api/ordens-servico/{ordem.id}/atualizar-status/', {'status': novo, **extra}, format='json')

    def test_quem_avanca_assume_e_grava_inicio(self):
        ordem = self.os()
        with patch('django.utils.timezone.now', return_value=AGORA):
            self.assertEqual(self.mover(self.caio, ordem, 'em_desenvolvimento').status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertEqual((ordem.responsavel, ordem.inicio_trabalho), (self.caio, AGORA))

    def test_outro_funcionario_finaliza_sem_tirar_o_responsavel(self):
        ordem = self.os(status='em_desenvolvimento', responsavel=self.caio, inicio_trabalho=hora(10, 11))
        self.assertEqual(self.mover(self.bruna, ordem, 'finalizada').status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertEqual((ordem.responsavel, ordem.finalizado_por), (self.caio, self.bruna))
        self.assertEqual(ordem.inicio_trabalho, hora(10, 11))

    def test_voltar_para_pendente_devolve_para_a_fazer(self):
        ordem = self.os(status='em_desenvolvimento', responsavel=self.caio, inicio_trabalho=hora(10, 11))
        self.mover(self.caio, ordem, 'pendente')
        ordem.refresh_from_db()
        self.assertEqual((ordem.responsavel, ordem.inicio_trabalho, ordem.finalizado_por), (None, None, None))

    def test_finalizar_direto_de_pendente_atribui_quem_finalizou(self):
        ordem = self.os()
        self.mover(self.bruna, ordem, 'finalizada')
        ordem.refresh_from_db()
        self.assertEqual((ordem.responsavel, ordem.finalizado_por), (self.bruna, self.bruna))

    def test_reabrir_finalizada_desfaz_finalizado_por(self):
        ordem = self.os(status='finalizada', responsavel=self.caio, finalizado_por=self.caio, data_finalizacao=hora(10, 12))
        self.mover(self.patrao, ordem, 'em_desenvolvimento')
        ordem.refresh_from_db()
        self.assertEqual((ordem.responsavel, ordem.finalizado_por), (self.caio, None))

    def test_mudanca_de_status_pela_edicao_tambem_registra(self):
        ordem = self.os()
        response = self.api(self.patrao).patch(f'/api/ordens-servico/{ordem.id}/', {'status': 'em_desenvolvimento'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['responsavel_nome'], 'Administrador')
        self.assertIsNotNone(response.data['inicio_trabalho'])


class AgendaEndpointTest(Base):
    url = '/api/agenda/'

    def agenda(self, usuario, **params):
        with patch('django.utils.timezone.now', return_value=AGORA):
            return self.api(usuario).get(self.url, {'inicio': '2026-09-07', 'fim': '2026-09-13', **params})

    def test_monta_a_fazer_e_blocos(self):
        pendente = self.os(prazo_entrega=hora(11, 10))
        self.os(prazo_entrega=hora(20, 10))  # fora da semana
        atrasada_a_fazer = self.os(prazo_entrega=hora(10, 14))
        andamento = self.os(status='em_desenvolvimento', responsavel=self.caio, inicio_trabalho=hora(10, 11), prazo_entrega=hora(10, 14))
        feita = self.os(status='finalizada', responsavel=self.bruna, finalizado_por=self.bruna, inicio_trabalho=hora(8, 9), data_finalizacao=hora(8, 11, 30))
        antiga = self.os(status='finalizada', data_finalizacao=hora(9, 16))
        self.os(status='cancelada', prazo_entrega=hora(11, 9))

        dados = self.agenda(self.patrao).data
        self.assertEqual([i['id'] for i in dados['a_fazer']], [atrasada_a_fazer.id, pendente.id])
        self.assertTrue(dados['a_fazer'][0]['atrasada'])

        blocos = {b['id']: b for b in dados['blocos']}
        self.assertEqual(set(blocos), {andamento.id, feita.id, antiga.id})
        self.assertEqual(blocos[andamento.id]['inicio'], '2026-09-10T11:00:00-03:00')
        self.assertEqual(blocos[andamento.id]['fim'], '2026-09-10T15:10:00-03:00')
        self.assertTrue(blocos[andamento.id]['atrasada'])
        self.assertEqual(blocos[andamento.id]['responsavel']['iniciais'], 'CS')
        self.assertEqual((blocos[feita.id]['inicio'], blocos[feita.id]['fim']), ('2026-09-08T09:00:00-03:00', '2026-09-08T11:30:00-03:00'))
        # OS antiga sem horário de início: bloco de 30 min até a finalização
        self.assertEqual((blocos[antiga.id]['inicio'], blocos[antiga.id]['fim']), ('2026-09-09T15:30:00-03:00', '2026-09-09T16:00:00-03:00'))
        self.assertTrue(blocos[antiga.id]['sem_horario_inicio'])
        self.assertIsNone(blocos[antiga.id]['responsavel'])

    def test_em_andamento_antiga_sem_inicio_nao_vira_bloco_de_meses(self):
        antiga = self.os(status='em_desenvolvimento', responsavel=None, prazo_entrega=hora(1, 10))
        OrdemServico.objects.filter(pk=antiga.pk).update(data_criacao=hora(1, 9))
        bloco = self.agenda(self.patrao).data['blocos'][0]
        self.assertEqual((bloco['id'], bloco['inicio'], bloco['fim'], bloco['sem_horario_inicio']), (antiga.id, None, None, True))
        # Em outra semana (que não inclui hoje) ela não aparece
        with patch('django.utils.timezone.now', return_value=AGORA):
            outra = self.api(self.patrao).get(self.url, {'inicio': '2026-08-31', 'fim': '2026-09-06'}).data
        self.assertEqual(outra['blocos'], [])

    def test_filtra_por_profissional(self):
        a = self.os(status='em_desenvolvimento', responsavel=self.caio, inicio_trabalho=hora(10, 9))
        self.os(status='em_desenvolvimento', responsavel=self.bruna, inicio_trabalho=hora(10, 9))
        sem = self.os(status='finalizada', data_finalizacao=hora(10, 9))
        self.assertEqual([b['id'] for b in self.agenda(self.bruna, responsavel=self.caio.id).data['blocos']], [a.id])
        self.assertEqual([b['id'] for b in self.agenda(self.bruna, responsavel='sem').data['blocos']], [sem.id])

    def test_funcionario_ve_faturada_sem_valores(self):
        self.os(status='finalizada', faturada=True, forma_pagamento='pix', responsavel=self.caio, data_finalizacao=hora(9, 10), inicio_trabalho=hora(9, 9))
        bloco_func = self.agenda(self.caio).data['blocos'][0]
        self.assertTrue(bloco_func['faturada'])
        self.assertNotIn('valor', bloco_func)
        self.assertNotIn('forma_pagamento', bloco_func)
        self.assertEqual(self.agenda(self.patrao).data['blocos'][0]['valor'], 100.0)

    def test_profissionais_com_resumo(self):
        self.os(status='em_desenvolvimento', responsavel=self.caio, inicio_trabalho=hora(10, 9), prazo_entrega=hora(10, 12))
        criar_usuario('inativo@barra.com', 'Ex Funcionário', ativo=False)
        profissionais = {p['nome']: p for p in self.agenda(self.bruna).data['profissionais']}
        self.assertNotIn('Ex Funcionário', profissionais)
        self.assertEqual(list(profissionais)[0], 'Administrador')
        self.assertEqual((profissionais['Caio Souza']['em_andamento'], profissionais['Caio Souza']['atrasadas']), (1, 1))

    def test_periodo_e_login(self):
        self.assertEqual(self.agenda(self.patrao, inicio='2026-09-10', fim='2026-09-01').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.agenda(self.patrao, inicio='2026-01-01', fim='2026-06-01').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(APIClient().get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)


class AcoesDaAgendaTest(Base):
    def test_trocar_responsavel_so_patrao(self):
        ordem = self.os(status='em_desenvolvimento', responsavel=self.caio, inicio_trabalho=hora(10, 9))
        url = f'/api/ordens-servico/{ordem.id}/trocar-responsavel/'
        self.assertEqual(self.api(self.bruna).post(url, {'responsavel_id': self.bruna.id}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        response = self.api(self.patrao).post(url, {'responsavel_id': self.bruna.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertEqual(ordem.responsavel, self.bruna)

    def test_trocar_responsavel_validacoes(self):
        pendente = self.os()
        andamento = self.os(status='em_desenvolvimento', responsavel=self.caio)
        inativo = criar_usuario('x@barra.com', 'Inativo', ativo=False)
        p = self.api(self.patrao)
        self.assertEqual(p.post(f'/api/ordens-servico/{pendente.id}/trocar-responsavel/', {'responsavel_id': self.caio.id}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(p.post(f'/api/ordens-servico/{andamento.id}/trocar-responsavel/', {'responsavel_id': inativo.id}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_mudar_prazo(self):
        ordem = self.os()  # criada pela Bruna
        url = f'/api/ordens-servico/{ordem.id}/mudar-prazo/'
        novo = '2026-09-11T14:30:00-03:00'
        self.assertEqual(self.api(self.caio).post(url, {'prazo_entrega': novo}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.api(self.bruna).post(url, {'prazo_entrega': novo}, format='json').status_code, status.HTTP_200_OK)
        ordem.refresh_from_db()
        self.assertEqual(ordem.prazo_entrega, hora(11, 14, 30))
        self.assertEqual(self.api(self.patrao).post(url, {'prazo_entrega': 'amanhã'}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_nao_move_finalizada_nem_faturada(self):
        for extra in ({'status': 'finalizada', 'data_finalizacao': hora(9, 9)}, {'status': 'em_desenvolvimento', 'faturada': True}):
            with self.subTest(extra=extra):
                ordem = self.os(**extra)
                response = self.api(self.patrao).post(f'/api/ordens-servico/{ordem.id}/mudar-prazo/', {'prazo_entrega': '2026-09-11T10:00:00-03:00'}, format='json')
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
