import './FormattedView.css';

const Field = ({ label, value }) => (
  <div className="field">
    <span className="field-label">{label}</span>
    <span className="field-value">{value ?? <em className="empty">Não informado</em>}</span>
  </div>
);

const Card = ({ title, icon, children, full }) => (
  <div className={`card${full ? ' card-full' : ''}`}>
    <div className="card-header">
      {icon && <div className="card-icon">{icon}</div>}
      <h3 className="card-title">{title}</h3>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const IconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconDoc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconBox = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
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
    <div className="formatted-view">
      <Card title="Fornecedor" icon={<IconBuilding />}>
        <Field label="Razão Social" value={fornecedor?.razao_social} />
        <Field label="Nome Fantasia" value={fornecedor?.fantasia} />
        <Field label="CNPJ" value={fornecedor?.cnpj} />
      </Card>

      <Card title="Faturado" icon={<IconUser />}>
        <Field label="Nome Completo" value={faturado?.nome_completo} />
        <Field label="CPF" value={faturado?.cpf} />
      </Card>

      <Card title="Dados da Nota Fiscal" icon={<IconDoc />}>
        <div className="fields-row">
          <Field label="Número" value={numero_nota_fiscal} />
          <Field label="Data de Emissão" value={formatDate(data_emissao)} />
          <Field label="Valor Total" value={formatCurrency(valor_total)} />
        </div>
      </Card>

      <Card title="Produtos / Serviços" icon={<IconBox />}>
        <p className="descricao">{descricao_produtos ?? <em className="empty">Não informado</em>}</p>
      </Card>

      {parcelas && parcelas.length > 0 && (
        <Card title="Parcelas" icon={<IconCalendar />}>
          <table className="parcelas-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vencimento</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr key={p.numero_parcela}>
                  <td>{p.numero_parcela}</td>
                  <td>{formatDate(p.data_vencimento) ?? '—'}</td>
                  <td className="valor-cell">{formatCurrency(p.valor) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {classificacoes_despesa && classificacoes_despesa.length > 0 && (
        <Card title="Classificação de Despesa" icon={<IconTag />}>
          <div className="badges">
            {classificacoes_despesa.map((c, i) => (
              <div key={i} className="badge-item">
                <span className="badge">{c.categoria}</span>
                {c.descricao && <span className="badge-desc">{c.descricao}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
