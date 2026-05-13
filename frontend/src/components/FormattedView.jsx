import './FormattedView.css';

const CATEGORY_COLORS = {
  'INSUMOS AGRÍCOLAS':           { bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' },
  'MANUTENÇÃO E OPERAÇÃO':       { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', dot: '#f97316' },
  'RECURSOS HUMANOS':            { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed', dot: '#a855f7' },
  'SERVIÇOS OPERACIONAIS':       { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', dot: '#3b82f6' },
  'INFRAESTRUTURA E UTILIDADES': { bg: '#fff1f2', border: '#fda4af', text: '#be123c', dot: '#f43f5e' },
  'ADMINISTRATIVAS':             { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', dot: '#64748b' },
  'SEGUROS E PROTEÇÃO':          { bg: '#fefce8', border: '#fde047', text: '#a16207', dot: '#eab308' },
  'IMPOSTOS E TAXAS':            { bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1', dot: '#0ea5e9' },
  'INVESTIMENTOS':               { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857', dot: '#10b981' },
};
const DEFAULT_COLOR = { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', dot: '#94a3b8' };

function getCategoryStyle(categoria) {
  if (!categoria) return DEFAULT_COLOR;
  const upper = categoria.toUpperCase();
  const match = Object.keys(CATEGORY_COLORS).find(k => upper.includes(k.split(' ')[0]));
  return CATEGORY_COLORS[match] || DEFAULT_COLOR;
}

const SectionLabel = ({ children }) => (
  <div className="fv-section-label">{children}</div>
);

const DataRow = ({ label, value }) => (
  <div className="fv-data-row">
    <span className="fv-data-label">{label}</span>
    <span className="fv-data-value">{value ?? <span className="fv-na">—</span>}</span>
  </div>
);

export default function FormattedView({ data }) {
  const {
    fornecedor, faturado, numero_nota_fiscal, data_emissao,
    descricao_produtos, valor_total, parcelas, classificacoes_despesa,
  } = data;

  const formatCurrency = (v) =>
    v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : null;

  const formatDate = (d) => {
    if (!d) return null;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="fv">

      {/* ── KPI Bar ── */}
      <div className="fv-kpi-bar">
        <div className="fv-kpi">
          <span className="fv-kpi-label">Valor Total</span>
          <span className="fv-kpi-value fv-kpi-money">{formatCurrency(valor_total) ?? '—'}</span>
        </div>
        <div className="fv-kpi-sep" />
        <div className="fv-kpi">
          <span className="fv-kpi-label">Nota Fiscal</span>
          <span className="fv-kpi-value">#{numero_nota_fiscal ?? '—'}</span>
        </div>
        <div className="fv-kpi-sep" />
        <div className="fv-kpi">
          <span className="fv-kpi-label">Emissão</span>
          <span className="fv-kpi-value">{formatDate(data_emissao) ?? '—'}</span>
        </div>
        <div className="fv-kpi-sep" />
        <div className="fv-kpi">
          <span className="fv-kpi-label">Parcelas</span>
          <span className="fv-kpi-value">{parcelas?.length ?? '—'}x</span>
        </div>
      </div>

      {/* ── Body: two asymmetric columns ── */}
      <div className="fv-body">

        <div className="fv-col-left">
          <div className="fv-block">
            <SectionLabel>Fornecedor</SectionLabel>
            <DataRow label="Razão Social" value={fornecedor?.razao_social} />
            <DataRow label="Fantasia" value={fornecedor?.fantasia} />
            <DataRow label="CNPJ" value={fornecedor?.cnpj} />
          </div>
          <div className="fv-inner-sep" />
          <div className="fv-block">
            <SectionLabel>Faturado</SectionLabel>
            <DataRow label="Nome Completo" value={faturado?.nome_completo} />
            <DataRow label="CPF" value={faturado?.cpf} />
          </div>
        </div>

        <div className="fv-col-right">
          <div className="fv-block">
            <SectionLabel>Produtos / Serviços</SectionLabel>
            <p className="fv-descricao">
              {descricao_produtos ?? <span className="fv-na">Não informado</span>}
            </p>
          </div>

          {classificacoes_despesa && classificacoes_despesa.length > 0 && (
            <>
              <div className="fv-inner-sep" />
              <div className="fv-block">
                <SectionLabel>Classificação de Despesa</SectionLabel>
                <div className="fv-cat-list">
                  {classificacoes_despesa.map((c, i) => {
                    const col = getCategoryStyle(c.categoria);
                    return (
                      <div
                        key={i}
                        className="fv-cat-pill"
                        style={{ background: col.bg, borderColor: col.border, color: col.text }}
                      >
                        <span className="fv-cat-dot" style={{ background: col.dot }} />
                        <div className="fv-cat-content">
                          <span className="fv-cat-name">{c.categoria ?? 'Não identificado'}</span>
                          {c.descricao && <span className="fv-cat-desc">{c.descricao}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Parcelas Timeline ── */}
      {parcelas && parcelas.length > 0 && (
        <div className="fv-timeline-section">
          <SectionLabel>Cronograma de Pagamento</SectionLabel>
          <div className="fv-timeline">
            {parcelas.map((p, i) => (
              <div key={p.numero_parcela} className="fv-timeline-entry">
                {i > 0 && <div className="fv-timeline-connector" />}
                <div className="fv-timeline-step">
                  <div className="fv-timeline-dot">{p.numero_parcela}</div>
                  <div className="fv-timeline-info">
                    <span className="fv-timeline-date">{formatDate(p.data_vencimento) ?? '—'}</span>
                    <span className="fv-timeline-val">{formatCurrency(p.valor) ?? '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
