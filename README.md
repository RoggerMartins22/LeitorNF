# Extrator de Notas Fiscais com IA

Sistema web para leitura, persistência e consulta inteligente de notas fiscais, usando Google Gemini como motor de IA.

## Stack

- **Backend:** Python + FastAPI + SQLAlchemy + Pydantic + Uvicorn
- **Frontend:** React (Vite) + Axios
- **IA:** Google Gemini API (`gemini-2.5-flash` + `text-embedding-004`)
- **Banco de dados:** PostgreSQL
- **Containerização:** Docker + Docker Compose

## Funcionalidades

### Etapa 1 — Extração de NF
- Upload de PDF de nota fiscal
- Extração automática de dados via IA (fornecedor, faturado, valor, parcelas, etc.)
- Classificação automática da despesa por categoria
- Visualização formatada e JSON dos dados extraídos

### Etapa 2 — Persistência e Gestão
- Lançamento de notas no banco PostgreSQL (contas a pagar / a receber)
- CRUD completo de Fornecedores, Faturados, Classificações e Movimentos
- Prevenção de duplicatas por número de NF

### Etapa 3 — Consulta com RAG
- **RAG Simples:** perguntas em linguagem natural respondidas via busca textual (`ILIKE`) no banco
- **RAG Embeddings:** busca semântica por similaridade de cosseno usando vetores `text-embedding-004`
- Indexação dos movimentos como documentos vetorizados (tabela `rag_documents`)
- Respostas elaboradas pelo Gemini com citação das fontes utilizadas
- Histórico de consultas na sessão

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

## Endpoints RAG (Etapa 3)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/rag/status` | Retorna contagem de movimentos no banco e documentos indexados |
| `POST` | `/api/rag/indexar` | (Re)gera embeddings de todos os movimentos — chame antes de usar o modo Embeddings |
| `POST` | `/api/rag/perguntar` | Recebe `{ "pergunta": "...", "modo": "simples" \| "embeddings" }` e retorna resposta + fontes |

### Como usar a Consulta RAG do zero

1. Suba os containers: `docker-compose up --build`
2. Importe ao menos uma nota fiscal pela tela **Importar NF** usando "Extrair e Lançar"
3. Acesse a seção **Consulta IA (RAG)** na barra lateral
4. Para o modo **RAG Simples**: basta digitar a pergunta e clicar em **Perguntar**
5. Para o modo **RAG Embeddings**: clique em **Indexar base** primeiro (aguarde a confirmação), depois faça a pergunta
6. As fontes utilizadas são listadas abaixo da resposta
