#!/usr/bin/env python3
"""
Seed script — Fase 3 do projeto LeitorNF.

Popula o banco com 200 registros realistas (pt_BR) distribuídos entre:
    - 80 Pessoas tipo CLIENTE-FORNECEDOR (64 ativo / 16 inativo)
    - 40 Pessoas tipo FATURADO          (32 ativo /  8 inativo)
    - 20 Contas                          (16 ativo /  4 inativo)
    - 20 Classificações DESPESA          (16 ativo /  4 inativo)
    - 15 Classificações RECEITA          (12 ativo /  3 inativo)
    - 24 MovimentoContas (com parcelas + classificações filhas)
    - 1  Usuário coordenador (já criado em main.py via seed_usuario_admin)

Total: 199 + 1 usuário = 200 registros.

Execução dentro do container backend:
    docker compose exec backend python /app/scripts/seed_200.py

Execução local (com DATABASE_URL no ambiente):
    DATABASE_URL=postgresql://nf_user:nf_pass@localhost:5433/nf_db \
        python backend/scripts/seed_200.py

Flags:
    --force   pula o prompt de segurança quando o banco já contém pessoas.
"""

import os
import sys
import random
from datetime import date, timedelta

# Permite "from app.models.* import ..." quando rodado a partir de /app/scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from faker import Faker

from app.models.pessoas import Pessoas
from app.models.classificacao import Classificacao
from app.models.conta import Conta
from app.models.movimento import (
    MovimentoContas,
    ParcelaContas,
    MovimentoClassificacao,
)


DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://nf_user:nf_pass@db:5432/nf_db"
)

FORCE = "--force" in sys.argv

fake = Faker("pt_BR")
Faker.seed(20260618)
random.seed(20260618)


# ---------------------------------------------------------------------------
# Catálogos fixos (realistas para agronegócio)
# ---------------------------------------------------------------------------

CLASSIFICACOES_DESPESA = [
    ("INSUMOS AGRÍCOLAS", "Sementes de soja certificadas"),
    ("INSUMOS AGRÍCOLAS", "Fertilizantes NPK"),
    ("INSUMOS AGRÍCOLAS", "Defensivos agrícolas - herbicidas"),
    ("INSUMOS AGRÍCOLAS", "Defensivos agrícolas - fungicidas"),
    ("INSUMOS AGRÍCOLAS", "Corretivos de solo - calcário"),
    ("MANUTENÇÃO E OPERAÇÃO", "Combustíveis e lubrificantes"),
    ("MANUTENÇÃO E OPERAÇÃO", "Peças e componentes de máquinas"),
    ("MANUTENÇÃO E OPERAÇÃO", "Manutenção de tratores e colhedoras"),
    ("MANUTENÇÃO E OPERAÇÃO", "Ferramentas e utensílios"),
    ("RECURSOS HUMANOS", "Salários e encargos trabalhistas"),
    ("RECURSOS HUMANOS", "Mão de obra temporária safra"),
    ("SERVIÇOS OPERACIONAIS", "Frete e transporte de grãos"),
    ("SERVIÇOS OPERACIONAIS", "Colheita terceirizada"),
    ("SERVIÇOS OPERACIONAIS", "Pulverização aérea"),
    ("INFRAESTRUTURA E UTILIDADES", "Energia elétrica rural"),
    ("INFRAESTRUTURA E UTILIDADES", "Arrendamento de terras"),
    ("ADMINISTRATIVAS", "Honorários contábeis"),
    ("SEGUROS E PROTEÇÃO", "Seguro agrícola safra"),
    ("IMPOSTOS E TAXAS", "ITR e taxas rurais"),
    ("INVESTIMENTOS", "Aquisição de máquinas e implementos"),
]

CLASSIFICACOES_RECEITA = [
    ("VENDA DE GRÃOS", "Venda de soja a granel"),
    ("VENDA DE GRÃOS", "Venda de milho a granel"),
    ("VENDA DE GRÃOS", "Venda de sorgo"),
    ("VENDA DE GRÃOS", "Venda de feijão carioca"),
    ("VENDA DE GRÃOS", "Venda de trigo"),
    ("PRESTAÇÃO DE SERVIÇOS", "Aluguel de máquinas agrícolas"),
    ("PRESTAÇÃO DE SERVIÇOS", "Serviços de pulverização para terceiros"),
    ("PRESTAÇÃO DE SERVIÇOS", "Colheita terceirizada prestada"),
    ("VENDA DE INSUMOS", "Revenda de sementes excedentes"),
    ("VENDA DE INSUMOS", "Revenda de fertilizantes"),
    ("ARRENDAMENTO", "Arrendamento de pasto"),
    ("ARRENDAMENTO", "Cessão de área agrícola"),
    ("SUBVENÇÕES", "Subvenção econômica safra"),
    ("FINANCEIRAS", "Rendimentos de aplicações"),
    ("OUTRAS RECEITAS", "Venda de bem do ativo imobilizado"),
]

BANCOS = [
    "Banco do Brasil",
    "Bradesco",
    "Itaú Unibanco",
    "Santander",
    "Caixa Econômica Federal",
    "Sicredi",
    "Sicoob",
    "Banrisul",
    "Banco Original",
    "BTG Pactual",
]

TIPOS_CONTA = ["CORRENTE", "POUPANCA", "CAIXA", "CARTAO_CREDITO"]

DESCRICOES_MOVIMENTO_DESPESA = [
    "Aquisição de defensivo agrícola lote {lote}",
    "Manutenção preventiva trator John Deere série {lote}",
    "Compra de sementes de soja {lote}kg",
    "Frete de calcário dolomítico — {lote} toneladas",
    "Pulverização aérea {lote} hectares — herbicida",
    "Reposição de peças plantadeira modelo {lote}",
    "Combustível diesel S-10 — pedido nº {lote}",
    "Honorários contábeis competência {lote}",
    "Energia elétrica — fatura referência {lote}",
    "Arrendamento de terras parcela {lote}",
    "Serviço de colheita terceirizada — gleba {lote}",
    "Aquisição de fertilizante NPK 20-05-20 — {lote} sacas",
]

DESCRICOES_MOVIMENTO_RECEITA = [
    "Venda de soja a granel — {lote} sacas de 60kg",
    "Venda de milho — contrato {lote}",
    "Prestação de serviço de pulverização — {lote} hectares",
    "Arrendamento de pasto referência {lote}",
    "Revenda de sementes excedentes — pedido {lote}",
    "Aluguel de colhedora — safra {lote}",
    "Venda de feijão carioca — lote {lote}",
    "Subvenção econômica safra {lote}",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def split_ativo(total: int, ativos: int):
    """Retorna lista de booleans determinística com a quantidade exata de ativos."""
    return [i < ativos for i in range(total)]


def make_descricao(tipo: str) -> str:
    pool = DESCRICOES_MOVIMENTO_DESPESA if tipo == "APAGAR" else DESCRICOES_MOVIMENTO_RECEITA
    template = random.choice(pool)
    return template.format(lote=random.randint(100, 9999))


def gerar_parcelas(valor_total: float, data_base: date):
    num = random.choice([1, 2, 3])
    base = round(valor_total / num, 2)
    parcelas = []
    soma = 0.0
    for p in range(1, num + 1):
        if p == num:
            valor = round(valor_total - soma, 2)
        else:
            valor = base
            soma += valor
        venc = data_base + timedelta(days=30 * p)
        parcelas.append((p, valor, venc.strftime("%Y-%m-%d")))
    return parcelas


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        existentes = session.query(Pessoas).count()
        if existentes > 5 and not FORCE:
            print(f"AVISO: o banco já contém {existentes} pessoas cadastradas.")
            resp = input("Continuar? (s/N): ").strip().lower()
            if resp != "s":
                print("Seed abortado pelo usuário.")
                return

        print("Iniciando seed (Fase 3)...\n")

        # -------------------------------------------------------------------
        # 1) Contas — 20 (16 ativo / 4 inativo)
        # -------------------------------------------------------------------
        contas_status = split_ativo(20, 16)
        contas_criadas = 0
        for i, ativo in enumerate(contas_status):
            tipo = TIPOS_CONTA[i % len(TIPOS_CONTA)]
            banco = random.choice(BANCOS) if tipo != "CAIXA" else None
            conta = Conta(
                nome=f"Conta {tipo.title()} {i + 1:02d}",
                tipo=tipo,
                banco=banco,
                agencia=(f"{random.randint(1, 9999):04d}" if banco else None),
                numero=(f"{random.randint(10000, 999999)}-{random.randint(0, 9)}" if banco else None),
                saldo_inicial=round(random.uniform(0.0, 75000.0), 2),
                ativo=ativo,
            )
            session.add(conta)
            contas_criadas += 1
        session.flush()
        print(f"  - {contas_criadas} contas inseridas")

        # -------------------------------------------------------------------
        # 2) Classificações DESPESA — 20 (16 ativo / 4 inativo)
        # -------------------------------------------------------------------
        despesa_status = split_ativo(20, 16)
        despesa_objs = []
        for i, ativo in enumerate(despesa_status):
            categoria, descricao = CLASSIFICACOES_DESPESA[i % len(CLASSIFICACOES_DESPESA)]
            c = Classificacao(
                tipo="DESPESA",
                descricao=f"{categoria} - {descricao}",
                ativo=ativo,
            )
            session.add(c)
            despesa_objs.append(c)
        session.flush()
        print(f"  - {len(despesa_objs)} classificações DESPESA inseridas")

        # -------------------------------------------------------------------
        # 3) Classificações RECEITA — 15 (12 ativo / 3 inativo)
        # -------------------------------------------------------------------
        receita_status = split_ativo(15, 12)
        receita_objs = []
        for i, ativo in enumerate(receita_status):
            categoria, descricao = CLASSIFICACOES_RECEITA[i % len(CLASSIFICACOES_RECEITA)]
            c = Classificacao(
                tipo="RECEITA",
                descricao=f"{categoria} - {descricao}",
                ativo=ativo,
            )
            session.add(c)
            receita_objs.append(c)
        session.flush()
        print(f"  - {len(receita_objs)} classificações RECEITA inseridas")

        # -------------------------------------------------------------------
        # 4) Pessoas CLIENTE-FORNECEDOR — 80 (64 ativo / 16 inativo)
        # -------------------------------------------------------------------
        forn_status = split_ativo(80, 64)
        forn_objs = []
        for ativo in forn_status:
            razao = fake.company()
            fantasia = fake.company_suffix() + " " + fake.last_name()
            p = Pessoas(
                tipo="CLIENTE-FORNECEDOR",
                razao_social=razao,
                nome_fantasia=fantasia,
                cnpj=fake.cnpj(),
                cpf=None,
                ativo=ativo,
            )
            session.add(p)
            forn_objs.append(p)
        session.flush()
        print(f"  - {len(forn_objs)} pessoas CLIENTE-FORNECEDOR inseridas")

        # -------------------------------------------------------------------
        # 5) Pessoas FATURADO — 40 (32 ativo / 8 inativo)
        # Mix: ~60% PF (CPF), ~40% PJ (CNPJ)
        # -------------------------------------------------------------------
        fat_status = split_ativo(40, 32)
        fat_objs = []
        for i, ativo in enumerate(fat_status):
            if i % 5 < 3:  # PF
                p = Pessoas(
                    tipo="FATURADO",
                    razao_social=fake.name(),
                    nome_fantasia=None,
                    cnpj=None,
                    cpf=fake.cpf(),
                    ativo=ativo,
                )
            else:  # PJ
                p = Pessoas(
                    tipo="FATURADO",
                    razao_social=fake.company(),
                    nome_fantasia=fake.company_suffix() + " " + fake.last_name(),
                    cnpj=fake.cnpj(),
                    cpf=None,
                    ativo=ativo,
                )
            session.add(p)
            fat_objs.append(p)
        session.flush()
        print(f"  - {len(fat_objs)} pessoas FATURADO inseridas")

        # -------------------------------------------------------------------
        # 6) MovimentoContas — 24 (com parcelas + classificações)
        # 18 APAGAR / 6 ARECEBER
        # -------------------------------------------------------------------
        forn_ativos = [p for p in forn_objs if p.ativo]
        fat_ativos = [p for p in fat_objs if p.ativo]
        desp_ativas = [c for c in despesa_objs if c.ativo]
        rec_ativas = [c for c in receita_objs if c.ativo]

        movs_criados = 0
        for i in range(24):
            tipo_mov = "APAGAR" if i < 18 else "ARECEBER"
            pessoa = random.choice(forn_ativos)
            faturado = random.choice(fat_ativos)
            data_base = date(2026, 1, 1) + timedelta(days=random.randint(0, 365))
            valor_total = round(random.uniform(500.0, 50000.0), 2)
            numero_nf = f"{random.randint(100000, 999999)}"

            mov = MovimentoContas(
                tipo=tipo_mov,
                numero_nf=numero_nf,
                data_nf=data_base.strftime("%Y-%m-%d"),
                valor_total=valor_total,
                descricao_produtos=make_descricao(tipo_mov),
                pessoa_id=pessoa.id,
                faturado_id=faturado.id,
                ativo=True,
            )
            session.add(mov)
            session.flush()

            for num_parc, valor_parc, venc in gerar_parcelas(valor_total, data_base):
                session.add(
                    ParcelaContas(
                        movimento_id=mov.id,
                        numero_parcela=num_parc,
                        valor=valor_parc,
                        data_vencimento=venc,
                    )
                )

            pool_class = desp_ativas if tipo_mov == "APAGAR" else rec_ativas
            qtd_class = random.choice([1, 2])
            for cl in random.sample(pool_class, min(qtd_class, len(pool_class))):
                session.add(
                    MovimentoClassificacao(
                        movimento_id=mov.id,
                        classificacao_id=cl.id,
                    )
                )
            movs_criados += 1

        session.commit()

        print(f"  - {movs_criados} movimentos inseridos (com parcelas + classificações)\n")

        print("Seed concluido. Distribuicao:")
        print("    80 Pessoas CLIENTE-FORNECEDOR (64 ativo / 16 inativo)")
        print("    40 Pessoas FATURADO          (32 ativo /  8 inativo)")
        print("    20 Contas                     (16 ativo /  4 inativo)")
        print("    20 Classificacoes DESPESA     (16 ativo /  4 inativo)")
        print("    15 Classificacoes RECEITA     (12 ativo /  3 inativo)")
        print("    24 Movimentos                 (com parcelas + classificacoes)")
        print("Total: 199 + 1 usuario coordenador (criado no startup) = 200 registros")

    except Exception as exc:
        session.rollback()
        print(f"\nERRO durante o seed: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
