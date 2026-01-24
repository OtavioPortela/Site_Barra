FROM node:22-alpine

WORKDIR /app

# Copiar apenas arquivos de dependências primeiro (para cache de layers)
COPY package*.json ./

# Limpar completamente e instalar dependências
RUN rm -rf node_modules .vite dist && \
    npm install --prefer-offline --no-audit

# Copiar todo o código fonte
COPY . .

# Limpar cache do Vite antes do build
RUN rm -rf node_modules/.vite .vite dist || true

# Build da aplicação
RUN npm run build

# Copiar e dar permissão ao script de start
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expor a porta (Railway injeta $PORT)
EXPOSE 3000

# Comando para servir os arquivos estáticos
CMD ["/app/start.sh"]

