# Padrão FIFA - Backend Analisador

Este é o backend para a extensão Padrão FIFA, responsável por sincronizar os números capturados com o banco de dados Neon PostgreSQL.

## Configuração no Vercel

1. Conecte este repositório ao Vercel.
2. Adicione a seguinte Variável de Ambiente (Environment Variable):
   - `DATABASE_URL`: A URL de conexão do seu banco de dados Neon.

## Endpoints

- `POST /sync`: Sincroniza os números capturados.
- `GET /data/:user_key`: Recupera os números salvos para uma chave específica.
