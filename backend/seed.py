"""
Seed script — insere 200 notas fiscais de exemplo no banco PostgreSQL.

Executar dentro do container backend:
    docker compose exec backend python seed.py

Ou direto no host (requer psycopg2: pip install psycopg2-binary sqlalchemy):
    DATABASE_URL=postgresql://nf_user:nf_pass@localhost:5433/nf_db python seed.py
"""

import os
import random
from datetime import date, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://nf_user:nf_pass@localhost:5433/nf_db"
)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# ---------------------------------------------------------------------------
# Dados-base
# ---------------------------------------------------------------------------

FORNECEDORES = [
    ("Agropecuária São João Ltda",          "São João Agro",       "12.345.678/0001-90"),
    ("Distribuidora Norte Agrícola Ltda",   "Norte Agro",          "23.456.789/0001-01"),
    ("Fertilizantes Brasil S.A.",           "FertBrasil",          "34.567.890/0001-12"),
    ("Defensivos Cerrado Ltda",             "Cerrado Def.",        "45.678.901/0001-23"),
    ("Sementes Premium do Brasil Ltda",     "Sementes Premium",    "56.789.012/0001-34"),
    ("Posto Combustível Estrela Ltda",      "Auto Estrela",        "67.890.123/0001-45"),
    ("Mecânica Rural Irmãos Souza Ltda",    "Mec. Souza",          "78.901.234/0001-56"),
    ("Peças e Implementos Agrícolas Ltda",  "Agri Peças",          "89.012.345/0001-67"),
    ("Transportadora Horizonte Ltda",       "Trans. Horizonte",    "90.123.456/0001-78"),
    ("Energia Solar Goiás S.A.",            "Solar GO",            "01.234.567/0001-89"),
    ("Construtora Rural Planalto Ltda",     "Planalto Obras",      "11.223.344/0001-55"),
    ("Contabilidade e Assessoria RV Ltda",  "Contábil RV",         "22.334.455/0001-66"),
    ("Seguradora Agro Nacional S.A.",       "AgriSeg",             "33.445.566/0001-77"),
    ("Máquinas e Implementos Central Ltda", "MIC Agro",            "44.556.677/0001-88"),
    ("Armazém Geral Central Ltda",          "AGC Armazém",         "55.667.788/0001-99"),
    ("Consultoria Agronômica Cerrado Ltda", "Agro Consult",        "66.778.899/0001-00"),
    ("Loja de Ferramentas Agrícolas Ltda",  "Ferr. Agro",          "77.889.900/0001-11"),
    ("Serviços de Colheita Machado Ltda",   "Colheita Machado",    "88.990.011/0001-22"),
    ("Calcário e Corretivos Goiás Ltda",    "CalGO",               "99.001.122/0001-33"),
    ("Irrigação e Sistemas Hídricos Ltda",  "AquaAgro",            "10.203.040/0001-50"),
]

FATURADOS = [
    ("Fazenda Santa Rosa Ltda",   None,              "14.725.836/0001-47"),
    ("Fazenda Boa Esperança",     None,              "25.836.947/0001-58"),
    ("Sítio Vale Verde",          None,              "36.947.058/0001-69"),
    ("Agropecuária Cerrado S.A.", None,              "47.058.169/0001-70"),
    ("João Pedro Almeida",        "892.345.678-90",  None),
]

CLASSIFICACOES = [
    ("DESPESA", "INSUMOS AGRÍCOLAS"),
    ("DESPESA", "MANUTENÇÃO E OPERAÇÃO"),
    ("DESPESA", "RECURSOS HUMANOS"),
    ("DESPESA", "SERVIÇOS OPERACIONAIS"),
    ("DESPESA", "INFRAESTRUTURA E UTILIDADES"),
    ("DESPESA", "ADMINISTRATIVAS"),
    ("DESPESA", "SEGUROS E PROTEÇÃO"),
    ("DESPESA", "IMPOSTOS E TAXAS"),
    ("DESPESA", "INVESTIMENTOS"),
]

DESCRICOES_POR_CLASSE = {
    "INSUMOS AGRÍCOLAS": [
        "Adubo NPK 20-05-20 - 50 sacas de 50kg",
        "Herbicida Roundup 5L - 20 unidades",
        "Sementes de Soja RR - 30 sacas de 40kg",
        "Fungicida Opera Ultra 1L - 10 unidades",
        "Calcário dolomítico - 30 toneladas",
        "Inseticida Engeo Pleno 250ml - 15 unidades",
        "Fertilizante foliar boro concentrado - 20 litros",
        "Sementes de milho híbrido DKB 390 - 10 sacas",
        "Ureia granulada 45% N - 40 sacas de 50kg",
        "Adjuvante agrícola Break Thru 1L - 5 unidades",
        "Inoculante líquido soja Nitrofix - 30 doses",
        "Micronutriente zinco quelato - 10 litros",
    ],
    "MANUTENÇÃO E OPERAÇÃO": [
        "Diesel S-10 - 500 litros",
        "Filtro de óleo motor John Deere 6110J - 4 unidades",
        "Pneu traseiro 18.4-34 - 2 unidades",
        "Correia dentada motor colhedora - 3 unidades",
        "Serviço de revisão trator 500h",
        "Lubrificante Shell Rimula R4 15W40 - 20L",
        "Parafusos e porcas plataforma colhedora - kit",
        "Manutenção preventiva plantadeira 13 linhas",
        "Óleo hidráulico Mobil DTE 26 - 50L",
        "Peças motor bomba irrigação - kit revisão",
        "Rolamento roda dianteira trator - 2 unidades",
        "Serviço de solda e recuperação de grade",
        "Filtro de ar primário e secundário motor - kit",
        "Lona de freio caminhão - 4 unidades",
    ],
    "RECURSOS HUMANOS": [
        "Mão de obra temporária safra - 10 diárias",
        "Salário operador de máquinas - 1 mês",
        "Encargos trabalhistas e 13º salário proporcional",
        "Serviço de tratorista temporário - 5 dias",
        "Mão de obra colheita manual feijão - 8 diárias",
        "Adiantamento salarial funcionário",
    ],
    "SERVIÇOS OPERACIONAIS": [
        "Frete de soja - 200 sacas de 60kg para armazém",
        "Serviço de colheita terceirizada - 150 ha soja",
        "Armazenagem de milho - 500 sacas 60kg",
        "Pulverização aérea - 80 ha herbicida",
        "Secagem de soja - 300 sacas 13,5% umidade",
        "Transporte de calcário - 30 toneladas",
        "Aplicação de calcário a granel - 25 ha",
        "Serviço de plantio terceirizado - 60 ha milho",
        "Frete grão para Cooperativa - 350 sacas",
        "Serviço de terraplanagem - nivelamento área",
    ],
    "INFRAESTRUTURA E UTILIDADES": [
        "Energia elétrica - fatura mensal bombeamento",
        "Construção de galpão metálico 200m²",
        "Reforma de cerca perimetral - 2km aramado",
        "Materiais de construção (cimento, areia, brita)",
        "Instalação elétrica trifásica poço artesiano",
        "Arrendamento de terras - parcela semestral",
        "Arame farpado galvanizado - 10 rolos",
        "Mourão de concreto - 200 unidades",
        "Telha metálica galvanizada - 150m²",
        "Tubulação PVC irrigação - 500 metros",
    ],
    "ADMINISTRATIVAS": [
        "Honorários contábeis mensais",
        "Assessoria jurídica agrária - contrato",
        "Tarifa bancária - conta corrente PJ mensal",
        "Honorários engenheiro agrônomo - ART lavoura",
        "Despesas com abertura de crédito rural Pronaf",
        "Assinatura sistema de gestão agrícola",
        "Registro de contrato cartório - procuração",
    ],
    "SEGUROS E PROTEÇÃO": [
        "Seguro agrícola safra soja 2025/26 - apólice",
        "Seguro prestamista crédito rural Pronaf",
        "Seguro de incêndio instalações rurais - anual",
        "Seguro trator John Deere 6110J 2022",
        "Seguro caminhonete F-250 XLT - renovação anual",
    ],
    "IMPOSTOS E TAXAS": [
        "ITR - Imposto Territorial Rural exercício 2025",
        "IPVA caminhonete F-250 2020 - cota única",
        "Taxa INCRA-CCIR - Certificado Cadastro Imóvel 2025",
        "IPTU terreno urbano sede administrativa",
        "Taxa licença ambiental - renovação anual",
    ],
    "INVESTIMENTOS": [
        "Aquisição trator New Holland TM7040 - seminovo",
        "Compra pulverizador autopropelido Jacto 3000L",
        "Implemento grade aradora 32 discos pesados",
        "Plataforma de milho 8 linhas - colhedora",
        "Silo metálico fundo cônico 1000 sacas",
        "Veículo pickup F-250 XLT 2024 - 0km",
        "Cultivador adubador 13 linhas - novo",
        "Sistema de irrigação pivô central 60ha",
        "Computador e sistema de gestão agrícola",
        "Gerador a diesel 15 kVA - novo",
    ],
}


def main():
    db = Session()
    try:
        print("Iniciando seed...")

        # --- Fornecedores ---
        forn_ids = {}
        for razao, fantasia, cnpj in FORNECEDORES:
            row = db.execute(
                text("SELECT id FROM pessoas WHERE cnpj = :cnpj AND tipo = 'CLIENTE-FORNECEDOR'"),
                {"cnpj": cnpj},
            ).fetchone()
            if row:
                forn_ids[cnpj] = row[0]
            else:
                result = db.execute(
                    text(
                        "INSERT INTO pessoas (tipo, razao_social, nome_fantasia, cnpj, ativo) "
                        "VALUES ('CLIENTE-FORNECEDOR', :rs, :nf, :cnpj, true) RETURNING id"
                    ),
                    {"rs": razao, "nf": fantasia, "cnpj": cnpj},
                )
                forn_ids[cnpj] = result.fetchone()[0]
        print(f"  {len(forn_ids)} fornecedores OK")

        # --- Faturados ---
        fat_ids = []
        for razao, cpf, cnpj in FATURADOS:
            if cpf:
                row = db.execute(
                    text("SELECT id FROM pessoas WHERE cpf = :cpf AND tipo = 'FATURADO'"),
                    {"cpf": cpf},
                ).fetchone()
                if row:
                    fat_ids.append(row[0])
                else:
                    result = db.execute(
                        text(
                            "INSERT INTO pessoas (tipo, razao_social, cpf, ativo) "
                            "VALUES ('FATURADO', :rs, :cpf, true) RETURNING id"
                        ),
                        {"rs": razao, "cpf": cpf},
                    )
                    fat_ids.append(result.fetchone()[0])
            else:
                row = db.execute(
                    text("SELECT id FROM pessoas WHERE cnpj = :cnpj AND tipo = 'FATURADO'"),
                    {"cnpj": cnpj},
                ).fetchone()
                if row:
                    fat_ids.append(row[0])
                else:
                    result = db.execute(
                        text(
                            "INSERT INTO pessoas (tipo, razao_social, cnpj, ativo) "
                            "VALUES ('FATURADO', :rs, :cnpj, true) RETURNING id"
                        ),
                        {"rs": razao, "cnpj": cnpj},
                    )
                    fat_ids.append(result.fetchone()[0])
        print(f"  {len(fat_ids)} faturados OK")

        # --- Classificações ---
        class_ids = {}
        for tipo, descricao in CLASSIFICACOES:
            row = db.execute(
                text("SELECT id FROM classificacao WHERE descricao = :desc"),
                {"desc": descricao},
            ).fetchone()
            if row:
                class_ids[descricao] = row[0]
            else:
                result = db.execute(
                    text(
                        "INSERT INTO classificacao (tipo, descricao, ativo) "
                        "VALUES (:tipo, :desc, true) RETURNING id"
                    ),
                    {"tipo": tipo, "desc": descricao},
                )
                class_ids[descricao] = result.fetchone()[0]
        print(f"  {len(class_ids)} classificações OK")

        db.commit()

        # --- 200 Movimentos ---
        forn_list = list(forn_ids.items())   # [(cnpj, id), ...]
        class_list = list(class_ids.items()) # [(descricao, id), ...]
        start_date = date(2024, 1, 1)

        print("Inserindo 200 notas fiscais...")
        for i in range(1, 201):
            _, forn_id = random.choice(forn_list)
            fat_id = random.choice(fat_ids)
            class_nome, class_id = random.choice(class_list)

            data_nf = start_date + timedelta(days=random.randint(0, 530))
            num_parcelas = random.choices([1, 2, 3], weights=[60, 25, 15])[0]
            valor_total = round(random.uniform(500.0, 85000.0), 2)
            descricao = random.choice(DESCRICOES_POR_CLASSE[class_nome])
            numero_nf = f"{random.randint(100000, 999999):06d}"
            tipo_mov = random.choices(["APAGAR", "ARECEBER"], weights=[75, 25])[0]

            result = db.execute(
                text(
                    "INSERT INTO movimentocontas "
                    "(tipo, numero_nf, data_nf, valor_total, descricao_produtos, pessoa_id, faturado_id) "
                    "VALUES (:tipo, :num_nf, :data_nf, :vt, :desc, :pid, :fid) RETURNING id"
                ),
                {
                    "tipo": tipo_mov,
                    "num_nf": numero_nf,
                    "data_nf": data_nf.strftime("%Y-%m-%d"),
                    "vt": valor_total,
                    "desc": descricao,
                    "pid": forn_id,
                    "fid": fat_id,
                },
            )
            mov_id = result.fetchone()[0]

            # Parcelas
            valor_parcela = round(valor_total / num_parcelas, 2)
            for p in range(1, num_parcelas + 1):
                venc = data_nf + timedelta(days=30 * p)
                db.execute(
                    text(
                        "INSERT INTO parcelacontas (movimento_id, numero_parcela, valor, data_vencimento) "
                        "VALUES (:mid, :np, :v, :dv)"
                    ),
                    {"mid": mov_id, "np": p, "v": valor_parcela, "dv": venc.strftime("%Y-%m-%d")},
                )

            # Vínculo com classificação
            db.execute(
                text(
                    "INSERT INTO movimentoclassificacao (movimento_id, classificacao_id) "
                    "VALUES (:mid, :cid)"
                ),
                {"mid": mov_id, "cid": class_id},
            )

            if i % 50 == 0:
                db.commit()
                print(f"  {i}/200 inseridos...")

        db.commit()
        print("\nSeed concluído! 200 notas fiscais inseridas com sucesso.")

    except Exception as e:
        db.rollback()
        print(f"\nErro durante o seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
