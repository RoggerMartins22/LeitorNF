# Extrator de Notas Fiscais com IA

Sistema web para leitura, persistência e consulta inteligente de notas fiscais brasileiras, com extração automática de dados via Google Gemini.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python · FastAPI · SQLAlchemy · Pydantic · Uvicorn |
| Frontend | React (Vite) · Axios |
| IA | Google Gemini API (`gemini-2.5-flash` · `text-embedding-004`) |
| Banco de dados | PostgreSQL |
| Containerização | Docker · Docker Compose |

## Funcionalidades

### Extração de notas fiscais
- Upload de PDF via interface web
- Extração automática de fornecedor, faturado, número, data, valor, parcelas e descrição
- Classificação automática da despesa por categoria (Insumos, Manutenção, Serviços, etc.)
- Visualização formatada e JSON dos dados extraídos

### Gestão financeira
- Lançamento de notas no banco como contas a pagar ou a receber
- Prevenção de duplicatas por número de NF
- CRUD completo de Fornecedores/Clientes, Faturados, Classificações, Contas e Movimentos
- Delete lógico em todos os cadastros (`PATCH /{id}/inativar`) — nenhum registro é removido fisicamente
- Busca com múltiplos filtros simultâneos e ordenação clicável por coluna

### Consulta com IA (RAG)
- **RAG Simples** — busca por palavras-chave via `ILIKE` no banco
- **RAG Embeddings** — busca semântica por similaridade de cosseno com vetores `text-embedding-004`
- **RAG Analítico** — envia todos os movimentos ativos ao Gemini; ideal para perguntas globais como "maior valor", "total por categoria" ou "parcelas vencidas"
- Respostas com citação das fontes utilizadas e histórico da sessão

### Autenticação
- Login com JWT; token renovado a cada 60 minutos
- Todas as rotas protegidas por `Bearer` token
- Rate limiting de 5 tentativas/minuto no endpoint de login

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- Chave de API do Google Gemini — [obter aqui](https://aistudio.google.com/app/apikey)

## Como rodar

### 1. Clone o repositório

```bash
git clone https://github.com/RoggerMartins22/LeitorNF.git
cd LeitorNF
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com suas credenciais reais conforme os comentários do `.env.example`.

> Para gerar a `SECRET_KEY`:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 3. Suba os containers

```bash
docker-compose up --build
```

### 4. Acesse

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend (API) | http://localhost:8001 |
| Documentação Swagger | http://localhost:8001/docs |
| PostgreSQL | localhost:5433 |

## Estrutura do projeto

```
├── docker-compose.yml
├── .env.example
├── seed_inserts.txt
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

## Endpoints principais

### Extração e lançamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/extract` | Extrai dados de um PDF via IA e retorna JSON |
| `POST` | `/api/lancar` | Extrai e persiste a nota no banco |

### Consulta RAG

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/rag/status` | Contagem de movimentos e documentos indexados |
| `POST` | `/api/rag/indexar` | Gera embeddings de todos os movimentos ativos |
| `POST` | `/api/rag/perguntar` | Responde perguntas em linguagem natural |

Payload do `/api/rag/perguntar`:

```json
{
  "pergunta": "Qual o valor total gasto com insumos agrícolas?",
  "modo": "simples" 
}
```

`modo` aceita `"simples"`, `"embeddings"` ou `"analitico"`.

### Como usar o RAG

1. Importe ao menos uma nota pela tela **Importar NF**
2. Acesse **Consulta IA (RAG)** na barra lateral
3. **RAG Simples** — digite a pergunta e clique em **Perguntar**
4. **RAG Embeddings** — clique em **Indexar base** antes da primeira consulta
5. **RAG Analítico** — use para perguntas que exigem visão do banco completo

## Seed de dados de teste

Para popular o banco com 200 notas fiscais de exemplo, execute após subir os containers:

```bash
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -f /dev/stdin < seed_inserts.txt
```

O script insere fornecedores, faturados, classificações, contas e movimentos com parcelas consistentes.
