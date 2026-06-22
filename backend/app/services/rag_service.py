import re
from google import genai
from sqlalchemy.orm import Session
from app.config import settings
from app.repositories.rag_repository import RagRepository

client = genai.Client(api_key=settings.GEMINI_API_KEY)

STOPWORDS_PT = {
    "a", "ao", "aos", "aquela", "aquelas", "aquele", "aqueles", "aquilo", "as", "até",
    "com", "como", "da", "das", "de", "dela", "delas", "dele", "deles", "depois",
    "do", "dos", "e", "ela", "elas", "ele", "eles", "em", "entre", "era",
    "essa", "essas", "esse", "esses", "esta", "estas", "este", "estes", "foi",
    "há", "isso", "isto", "já", "lá", "mais", "mas", "me", "mesmo", "meu",
    "minha", "muito", "na", "não", "nas", "nem", "no", "nos", "nós",
    "num", "numa", "o", "os", "ou", "para", "pela", "pelas", "pelo", "pelos",
    "por", "qual", "quando", "que", "quem", "são", "se", "sem", "ser", "seu",
    "seus", "só", "sua", "suas", "também", "te", "tem", "temos", "tenho",
    "ter", "teu", "teus", "tua", "tuas", "tudo", "um", "uma", "umas", "uns",
    "você", "vocês",
}

_PROMPT_RESPOSTA = """Você é um assistente financeiro especializado em análise de notas fiscais e movimentos financeiros.

Data de hoje: {data_hoje}

IMPORTANTE: Os documentos fornecidos abaixo são uma AMOSTRA do banco de dados, não necessariamente o conjunto completo. Se a pergunta exigir análise de todos os registros (como "maior valor", "menor valor", "total", "todos os vencidos"), informe que está respondendo com base nos documentos recuperados e que o resultado pode não ser completo. Para análises globais, o usuário deve usar o modo Analítico.

Responda a pergunta do usuário SOMENTE com base nas informações fornecidas no contexto abaixo.
Se a informação não estiver no contexto, diga explicitamente que não encontrou essa informação nos dados disponíveis.
Não invente valores, datas ou nomes que não estejam no contexto.
Responda sempre em português do Brasil.
Formate valores monetários como R$ X.XXX,XX e datas como DD/MM/AAAA.
Seja objetivo e direto.

PERGUNTA: {pergunta}

CONTEXTO (documentos recuperados):
{contexto}

RESPOSTA:"""

_PROMPT_RESPOSTA_ANALITICO = """Você é um assistente financeiro especializado em análise de notas fiscais e movimentos financeiros.

Data de hoje: {data_hoje}

Você tem acesso ao conjunto COMPLETO de movimentos financeiros ativos do banco de dados.
Responda a pergunta com base em todos os documentos fornecidos — eles representam a totalidade dos dados.
Não invente valores, datas ou nomes que não estejam no contexto.
Responda sempre em português do Brasil.
Formate valores monetários como R$ X.XXX,XX e datas como DD/MM/AAAA.
Seja objetivo, direto e preciso.

PERGUNTA: {pergunta}

CONTEXTO (todos os movimentos ativos):
{contexto}

RESPOSTA:"""


def montar_documento_textual(item: dict) -> str:
    mov = item["movimento"]
    fornecedor = item.get("fornecedor")
    faturado = item.get("faturado")
    parcelas = item.get("parcelas", [])
    classificacoes = item.get("classificacoes", [])

    partes = [f"Nota Fiscal #{mov.numero_nf or 'N/A'} | Tipo: {mov.tipo}"]

    if fornecedor:
        partes.append(
            f"Fornecedor: {fornecedor.razao_social or ''} "
            f"({fornecedor.nome_fantasia or ''}) CNPJ: {fornecedor.cnpj or ''}"
        )

    if faturado:
        partes.append(f"Faturado: {faturado.razao_social or ''} CPF: {faturado.cpf or ''}")

    partes.append(f"Data de emissão: {mov.data_nf or 'N/A'}")
    partes.append(
        f"Valor Total: R$ {mov.valor_total:.2f}" if mov.valor_total is not None else "Valor Total: N/A"
    )

    if mov.descricao_produtos:
        partes.append(f"Produtos/Serviços: {mov.descricao_produtos}")

    if classificacoes:
        descs = ", ".join(c.descricao for c in classificacoes)
        partes.append(f"Classificações: {descs}")

    if parcelas:
        parcelas_str = "; ".join(
            f"Parcela {p.numero_parcela}: "
            f"{'R$ %.2f' % p.valor if p.valor is not None else 'N/A'} "
            f"vencimento {p.data_vencimento or 'N/A'}"
            for p in parcelas
        )
        partes.append(f"Parcelas: {parcelas_str}")

    return "\n".join(partes)


def _extrair_termos(pergunta: str) -> list:
    termos = pergunta.lower().split()
    return [t.strip(",.?!") for t in termos if t.strip(",.?!") not in STOPWORDS_PT and len(t.strip(",.?!")) > 2]


def _montar_contexto(textos: list) -> str:
    return "\n\n".join(f"[{i + 1}] {texto}" for i, texto in enumerate(textos))


def _extrair_nfs_mencionadas(texto: str) -> list:
    """
    Extrai números de NF mencionados no texto da resposta do Gemini.
    Padrões reconhecidos: #100054, NF 100054, NF#100054, Nota Fiscal 100054
    Retorna lista de strings com os números encontrados (sem #, sem espaços).
    """
    padroes = [
        r'#(\d{4,})',
        r'NF\s*#?\s*(\d{4,})',
        r'[Nn]ota\s+[Ff]iscal\s+#?\s*(\d{4,})',
    ]
    encontrados = set()
    for padrao in padroes:
        for match in re.finditer(padrao, texto):
            encontrados.add(match.group(1))
    return list(encontrados)


def _gerar_resposta_gemini(pergunta: str, contexto: str, prompt_template: str = None) -> str:
    from datetime import date
    data_hoje = date.today().strftime("%d/%m/%Y")
    template = prompt_template or _PROMPT_RESPOSTA
    prompt = template.format(pergunta=pergunta, contexto=contexto, data_hoje=data_hoje)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={"temperature": 0},
    )
    return response.text.strip()


def _item_para_fonte(item: dict) -> dict:
    mov = item["movimento"]
    fornecedor = item.get("fornecedor")
    return {
        "id": mov.id,
        "numero_nf": mov.numero_nf,
        "fornecedor": fornecedor.razao_social if fornecedor else None,
        "valor": mov.valor_total,
        "data_nf": mov.data_nf,
        "descricao": (mov.descricao_produtos or "")[:120],
    }


# ── RAG SIMPLES ──────────────────────────────────────────────────────────────

def rag_simples(db: Session, pergunta: str) -> dict:
    repo = RagRepository(db)
    termos = _extrair_termos(pergunta)
    itens = repo.buscar_por_termos(termos)

    if not itens:
        return {
            "resposta": "Não há movimentos cadastrados no banco de dados.",
            "modo": "simples",
            "fontes": [],
        }

    textos = [montar_documento_textual(item) for item in itens]
    contexto = _montar_contexto(textos)
    resposta = _gerar_resposta_gemini(pergunta, contexto)

    return {
        "resposta": resposta,
        "modo": "simples",
        "fontes": [_item_para_fonte(item) for item in itens],
    }


# ── RAG ANALÍTICO ────────────────────────────────────────────────────────────

def rag_analitico(db: Session, pergunta: str) -> dict:
    """
    Modo analítico: passa TODOS os movimentos ativos para o Gemini sem limite.
    Use para perguntas que exigem visão completa do banco:
    maior/menor valor, totais, rankings, parcelas vencidas, etc.

    Atenção: para bancos muito grandes (>500 NFs) o contexto pode ficar extenso.
    Nesse caso, considere pré-agregar os dados via SQL antes de passar ao modelo.
    """
    repo = RagRepository(db)
    itens = repo.listar_movimentos_completos()

    if not itens:
        return {
            "resposta": "Não há movimentos ativos cadastrados no banco de dados.",
            "modo": "analitico",
            "fontes": [],
        }

    textos = [montar_documento_textual(item) for item in itens]
    contexto = _montar_contexto(textos)
    resposta = _gerar_resposta_gemini(pergunta, contexto, prompt_template=_PROMPT_RESPOSTA_ANALITICO)

    nfs_mencionadas = _extrair_nfs_mencionadas(resposta)
    itens_mencionados = repo.buscar_por_numeros_nf(nfs_mencionadas) if nfs_mencionadas else []

    return {
        "resposta": resposta,
        "modo": "analitico",
        "fontes": [_item_para_fonte(item) for item in itens_mencionados],
        "total_analisado": len(itens),
    }


