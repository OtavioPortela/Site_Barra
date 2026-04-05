from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Usuario


def criar_usuario(email='teste@barra.com', password='senha123', nome='Teste User',
                  is_staff=False, ativo=True):
    user = Usuario.objects.create_user(
        username=email,
        email=email,
        password=password,
        nome_completo=nome,
        is_staff=is_staff,
    )
    user.ativo = ativo
    user.save()
    return user


def obter_token(client, email='teste@barra.com', password='senha123'):
    response = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    return response.data.get('access')


class LoginViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()

    def test_login_credenciais_validas(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'teste@barra.com',
            'password': 'senha123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'teste@barra.com')

    def test_login_senha_errada(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'teste@barra.com',
            'password': 'senhaerrada',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_email_inexistente(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'naoexiste@barra.com',
            'password': 'senha123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_usuario_inativo(self):
        criar_usuario(email='inativo@barra.com', password='senha123', ativo=False)
        # Django marca is_active=False para usuários inativos
        usuario = Usuario.objects.get(email='inativo@barra.com')
        usuario.is_active = False
        usuario.save()

        response = self.client.post('/api/auth/login/', {
            'email': 'inativo@barra.com',
            'password': 'senha123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_campos_obrigatorios(self):
        response = self.client.post('/api/auth/login/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retorno_contem_dados_usuario(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'teste@barra.com',
            'password': 'senha123',
        }, format='json')
        user_data = response.data['user']
        self.assertEqual(user_data['email'], 'teste@barra.com')
        self.assertIn('nome', user_data)
        self.assertIn('is_staff', user_data)


class MeViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()

    def test_me_autenticado(self):
        token = obter_token(self.client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'teste@barra.com')

    def test_me_sem_autenticacao(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_token_invalido(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = criar_usuario()

    def test_logout_autenticado(self):
        # Logout sem passar refresh token (blacklist não está instalado no projeto)
        token = obter_token(self.client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post('/api/auth/logout/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_sem_autenticacao(self):
        response = self.client.post('/api/auth/logout/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registro_valido(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'novo@barra.com',
            'username': 'novo@barra.com',
            'nome_completo': 'Novo Usuario',
            'password': 'senha12345',
            'password2': 'senha12345',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertTrue(Usuario.objects.filter(email='novo@barra.com').exists())

    def test_registro_email_duplicado(self):
        criar_usuario(email='duplicado@barra.com')
        response = self.client.post('/api/auth/register/', {
            'email': 'duplicado@barra.com',
            'username': 'duplicado@barra.com',
            'nome_completo': 'Duplicado',
            'password': 'senha12345',
            'password2': 'senha12345',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_senhas_diferentes(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'outro@barra.com',
            'username': 'outro@barra.com',
            'nome_completo': 'Outro',
            'password': 'senha12345',
            'password2': 'diferente',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FuncionarioViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_usuario(email='admin@barra.com', is_staff=True)
        self.funcionario = criar_usuario(email='func@barra.com', is_staff=False)

    def _auth_admin(self):
        token = obter_token(self.client, email='admin@barra.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def _auth_func(self):
        token = obter_token(self.client, email='func@barra.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_listar_funcionarios_admin(self):
        self._auth_admin()
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_listar_funcionarios_sem_permissao(self):
        self._auth_func()
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_criar_funcionario_admin(self):
        self._auth_admin()
        response = self.client.post('/api/auth/funcionarios/', {
            'email': 'novofunc@barra.com',
            'username': 'novofunc@barra.com',
            'nome_completo': 'Novo Funcionario',
            'password': 'senha12345',
            'password2': 'senha12345',
            'cargo': 'Costureira',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        novo = Usuario.objects.get(email='novofunc@barra.com')
        self.assertFalse(novo.is_staff)
