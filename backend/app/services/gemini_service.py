import google.generativeai as genai
import base64
import json
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

EXTRACTION_PROMPT = """Você é um especialista em análise de notas fiscais brasileiras.

Analise o PDF de nota fiscal fornecido e extraia os seguintes dados obrigatórios em formato JSON puro (sem markdown, sem explicações, apenas o JSON):

{
  "fornecedor": {
    "razao_social": "...",
    "fantasia": "...",
    "cnpj": "..."
  },
  "faturado": {
    "nome_completo": "...",
    "cpf": "..."
  },
  "numero_nota_fiscal": "...",
  "data_emissao": "YYYY-MM-DD",
  "descricao_produtos": "descrição completa dos produtos/serviços da nota",
  "valor_total": 0.00,
  "parcelas": [
    {
      "numero_parcela": 1,
      "data_vencimento": "YYYY-MM-DD",
      "valor": 0.00
    }
  ],
  "classificacoes_despesa": [
    {
      "categoria": "CATEGORIA_PRINCIPAL",
      "descricao": "subcategoria ou descrição da despesa"
    }
  ]
}

Regras para classificação de despesa (campo classificacoes_despesa):
- Analise os produtos/serviços da nota e classifique em uma das categorias abaixo:
  - INSUMOS AGRÍCOLAS (sementes, fertilizantes, defensivos agrícolas, corretivos)
  - MANUTENÇÃO E OPERAÇÃO (combustíveis, lubrificantes, peças, parafusos, componentes mecânicos, manutenção de máquinas, pneus, filtros, correias, ferramentas, utensílios)
  - RECURSOS HUMANOS (mão de obra temporária, salários, encargos)
  - SERVIÇOS OPERACIONAIS (frete, transporte, colheita terceirizada, secagem, armazenagem, pulverização, aplicação)
  - INFRAESTRUTURA E UTILIDADES (energia elétrica, arrendamento de terras, construções, reformas, materiais de construção)
  - ADMINISTRATIVAS (honorários contábeis/advocatícios/agronômicos, despesas bancárias, financeiras)
  - SEGUROS E PROTEÇÃO (seguro agrícola, seguro de ativos, seguro prestamista)
  - IMPOSTOS E TAXAS (ITR, IPTU, IPVA, INCRA-CCIR)
  - INVESTIMENTOS (aquisição de máquinas, implementos, veículos, imóveis, infraestrutura rural)

- Se não conseguir identificar um campo, use null.
- Para parcelas: se não houver informação de parcelamento, crie 1 parcela com o valor total e a data de vencimento da nota (ou null se não encontrar).
- Retorne SOMENTE o JSON, sem nenhum texto adicional."""


def extract_nota_fiscal(pdf_bytes: bytes) -> dict:
    # gemini_service.py
    model = genai.GenerativeModel("gemini-2.5-flash")

    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    response = model.generate_content([
        {
            "inline_data": {
                "mime_type": "application/pdf",
                "data": pdf_base64,
            }
        },
        EXTRACTION_PROMPT,
    ])

    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        parts = raw_text.split("```")
        raw_text = parts[1] if len(parts) > 1 else raw_text
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    raw_text = raw_text.strip()

    return json.loads(raw_text)
