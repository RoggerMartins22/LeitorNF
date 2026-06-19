# Extrator de Notas Fiscais com IA

Sistema web para leitura, persistência e consulta inteligente de notas fiscais, usando Google Gemini como motor de IA.

## Documentos relacionados

- [`MANUAL_ACESSO.md`](MANUAL_ACESSO.md) — credenciais e instruções de uso (Etapa 4 — Item 4.c).
- [`DEPLOY.md`](DEPLOY.md) — passo a passo de publicação em PythonAnywhere + Vercel.
- [`AUDIT.md`](AUDIT.md) — auditoria técnica do repositório (referência para a Etapa 4).

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

## Etapa 4 — Telas de manutenção

Novas telas CRUD com regras de busca/ordenação backend e delete lógico:

- **Contas** (`/contas` via sidebar → Cadastros → Contas): contas financeiras (CORRENTE / POUPANCA / CAIXA / CARTAO_CREDITO) com nome, banco, agência, número, saldo inicial.
- **Pessoas** (Fornecedores/Clientes e Faturados): refatorada para usar busca backend (`q`, `tipo`, `ativo`, `order_by`, `order_dir`) e ordenação clicável por coluna.
- **Classificações** (Tipos de Despesa / Receita): mesma refatoração.

Regras de UX iguais em todas:
- Tabela vazia ao abrir — só popula após clicar **Buscar** (com filtros) ou **Todos** (somente `ativo=True`).
- Ordenação por coluna (clique no cabeçalho alterna asc/desc).
- Busca aceita múltiplos critérios simultâneos (texto + tipo + status).
- Botão **Excluir** chama `PATCH /{id}/inativar` (delete lógico — nunca remove a linha do banco).
- Campo `status` (`ativo`) não é editável pelo usuário em nenhum formulário.

### Autenticação
Sistema agora exige login. A primeira execução cria automaticamente o usuário padrão (ver `MANUAL_ACESSO.md`). Token JWT é anexado pelo Axios interceptor em todas as chamadas; 401 limpa a sessão e volta para a tela de login.

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
SECRET_KEY=gere_uma_chave_aleatoria_segura_aqui
```

> A variável `SECRET_KEY` foi introduzida na **Etapa 4** (assina os tokens JWT do login). Gere uma chave forte com:
>
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```
>
> e copie o resultado para a linha `SECRET_KEY=...` do `.env`. O valor `DATABASE_URL` mantém o host `db:5432` porque é o nome/porta do serviço Postgres **dentro** da rede Docker (não confundir com a porta `5433` exposta no host).

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

## Seed de dados de teste

Para popular o banco com 200 registros realistas (pt_BR) — pessoas, contas, classificações e movimentos com parcelas — execute, com os containers já em pé:

```bash
docker compose exec backend python /app/scripts/seed_200.py
```

Distribuição gerada (Fase 3):

- 80 Pessoas `CLIENTE-FORNECEDOR` (64 ativo / 16 inativo)
- 40 Pessoas `FATURADO` (32 ativo / 8 inativo)
- 20 Contas (16 ativo / 4 inativo)
- 20 Classificações `DESPESA` (16 ativo / 4 inativo)
- 15 Classificações `RECEITA` (12 ativo / 3 inativo)
- 24 Movimentos (com parcelas + classificações filhas)
- 1 Usuário coordenador (já criado no startup via `seed_usuario_admin`)

> Por padrão o script pede confirmação se o banco já tiver pessoas cadastradas. Passe `--force` para pular o prompt em reexecuções:
>
> ```bash
> docker compose exec backend python /app/scripts/seed_200.py --force
> ```
