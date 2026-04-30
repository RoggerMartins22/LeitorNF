# Extrator de Notas Fiscais com IA

Sistema web que permite carregar um PDF de nota fiscal, acionar o Google Gemini via API para extrair os dados estruturados e exibir o resultado de forma formatada.

## Stack

- **Backend:** Python + FastAPI + SQLAlchemy + Pydantic + Uvicorn
- **Frontend:** React (Vite) + Axios
- **IA:** Google Gemini API (`gemini-2.5-flash`)
- **Banco de dados:** PostgreSQL
- **Containerização:** Docker + Docker Compose

## Funcionalidades

- Upload de PDF de nota fiscal
- Extração automática de dados via IA (fornecedor, faturado, valor, parcelas, etc.)
- Classificação automática da despesa por categoria
- Visualização formatada e JSON dos dados extraídos
- Botão para copiar o JSON extraído

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose instalados
- Chave de API do Google Gemini ([obter aqui](https://aistudio.google.com/app/apikey))

## Como rodar

### 1. Clone o repositório

```bash
git clone https://github.com/RoggerMartins22/LeitorNF.git
cd leitor-nf
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha com sua chave e credenciais do banco:

```env
GEMINI_API_KEY=sua_chave_aqui
POSTGRES_USER=nf_user
POSTGRES_PASSWORD=nf_pass
POSTGRES_DB=nf_db
DATABASE_URL=postgresql://nf_user:nf_pass@db:5432/nf_db
```

### 3. Suba os containers

```bash
docker-compose up --build
```

### 4. Acesse

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend (API) | http://localhost:8000 |
| Documentação Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

## Estrutura do projeto

```
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       ├── schemas/
│       ├── services/
│       ├── repositories/
│       └── controllers/
└── frontend/
    ├── Dockerfile
    └── src/
        ├── App.jsx
        ├── components/
        └── services/
```

## Dados extraídos

O sistema extrai e classifica automaticamente:

- Fornecedor (razão social, fantasia, CNPJ)
- Faturado (nome, CPF)
- Número e data da nota fiscal
- Descrição dos produtos/serviços
- Valor total e parcelas
- Classificação da despesa (ex: Insumos Agrícolas, Manutenção, Serviços Operacionais...)
