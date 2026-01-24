"""
Django settings for barra_confeccoes project.
"""

from pathlib import Path
from decouple import config, Csv
from datetime import timedelta
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS=['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_yasg',

    # Local apps
    'apps.authentication',
    'apps.ordens_servico',
    'apps.faturamento',
    'apps.whatsapp',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# Railway fornece DATABASE_URL ou variáveis PG*
# Priorizar DATABASE_URL se disponível (formato Railway)
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    # Railway ou outro provedor que fornece DATABASE_URL
    import re
    db_match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
    if db_match:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': db_match.group(5),
                'USER': db_match.group(1),
                'PASSWORD': db_match.group(2),
                'HOST': db_match.group(3),
                'PORT': db_match.group(4),
            }
        }
    else:
        # Fallback para formato alternativo
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': config('PGDATABASE', default=config('DATABASE_NAME', default='barra_confeccoes')),
                'USER': config('PGUSER', default=config('DATABASE_USER', default='postgres')),
                'PASSWORD': config('PGPASSWORD', default=config('DATABASE_PASSWORD', default='postgres')),
                'HOST': config('PGHOST', default=config('DATABASE_HOST', default='db')),
                'PORT': config('PGPORT', default=config('DATABASE_PORT', default='5432')),
            }
        }
else:
    # Modo local ou com variáveis individuais
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('PGDATABASE', default=config('DATABASE_NAME', default='barra_confeccoes')),
            'USER': config('PGUSER', default=config('DATABASE_USER', default='postgres')),
            'PASSWORD': config('PGPASSWORD', default=config('DATABASE_PASSWORD', default='postgres')),
            'HOST': config('PGHOST', default=config('DATABASE_HOST', default='db')),
            'PORT': config('PGPORT', default=config('DATABASE_PORT', default='5432')),
        }
    }


# Custom User Model
AUTH_USER_MODEL = 'authentication.Usuario'

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}


# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',
}


# CORS Settings
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:3001,http://localhost:5173',
    cast=Csv()
)

# Garantir que as origens comuns estão incluídas
CORS_ALLOWED_ORIGINS_LIST = list(CORS_ALLOWED_ORIGINS)
for origin in ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']:
    if origin not in CORS_ALLOWED_ORIGINS_LIST:
        CORS_ALLOWED_ORIGINS_LIST.append(origin)

# Permitir origens ngrok (qualquer subdomínio .ngrok.io ou .ngrok-free.app)
# Isso facilita o uso com ngrok sem precisar configurar manualmente
NGROK_MODE = config('NGROK_MODE', default=False, cast=bool)

# Permitir origens Railway (qualquer subdomínio .railway.app)
# Isso facilita o deploy na Railway sem precisar configurar manualmente
# IMPORTANTE: Defina RAILWAY_MODE=True nas variáveis de ambiente do Railway
# para permitir requisições de qualquer domínio .railway.app
RAILWAY_MODE = config('RAILWAY_MODE', default=True, cast=bool)

if NGROK_MODE or RAILWAY_MODE:
    # Modo ngrok/Railway: permitir todas as origens (apenas para desenvolvimento/teste/produção Railway)
    # Isso resolve problemas de CORS quando frontend e backend estão em domínios diferentes
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []  # Não usado quando ALLOW_ALL_ORIGINS é True
    # Debug: log para verificar se está ativo
    print(f"CORS: RAILWAY_MODE={RAILWAY_MODE}, NGROK_MODE={NGROK_MODE}, ALLOW_ALL_ORIGINS=True")
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_LIST
    print(f"CORS: ALLOW_ALL_ORIGINS=False, ALLOWED_ORIGINS={CORS_ALLOWED_ORIGINS}")

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Garantir que preflight requests sejam respondidos corretamente
CORS_PREFLIGHT_MAX_AGE = 86400


# Swagger/OpenAPI Documentation
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'USE_SESSION_AUTH': False,
}

# Twilio WhatsApp API Config
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default=None)
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default=None)
TWILIO_WHATSAPP_FROM = config('TWILIO_WHATSAPP_FROM', default=None)

