import { useState, useEffect, useCallback } from 'react';
import {
  getPessoas, criarPessoa, atualizarPessoa, inativarPessoa, reativarPessoa,
  getClassificacoes, criarClassificacao, atualizarClassificacao, inativarClassificacao,
  reativarClassificacao,
  getMovimentos, getMovimento, criarMovimento, atualizarMovimento,
  getParcelas,
} from '../services/api';
import './GestaoSection.css';

/* ── Utilidades ──────────────────────────────────── */

function Loader() {
  return (
    <div className="g-loader">
      <span className="g-spinner" />
      Carregando...
    </div>
  );
}

function Empty({ msg }) {
  return <div className="g-empty">{msg}</div>;
}

function Badge({ ativo }) {
  return (
    <span className={`g-badge ${ativo ? 'badge-ativo' : 'badge-inativo'}`}>
      {ativo ? 'ATIVO' : 'INATIVO'}
    </span>
  );
}

function Pill({ children, variant = 'default' }) {
  return <span className={`g-pill pill-${variant}`}>{children}</span>;
}

function formatCurrency(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

/* ── Modal ───────────────────────────────────────── */

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="g-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`g-modal ${wide ? 'g-modal-wide' : ''}`}>
        <div className="g-modal-header">
          <h3 className="g-modal-title">{title}</h3>
          <button className="g-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="g-modal-body">{children}</div>
      </div>
    </div>
  );
}

function FormError({ msg }) {
  return msg ? <div className="g-form-error">{msg}</div> : null;
}

function ModalFooter({ onClose, onSave, saving }) {
  return (
    <div className="g-modal-footer">
      <button className="g-btn-cancel" onClick={onClose}>Cancelar</button>
      <button className="g-btn-save" onClick={onSave} disabled={saving}>
        {saving ? <><span className="g-mini-spinner"/>Salvando...</> : 'Salvar'}
      </button>
    </div>
  );
}

/* ── Ações de linha ──────────────────────────────── */

function RowActions({ ativo, onEdit, onStatus, loading }) {
  return (
    <div className="g-row-actions">
      <button className="g-action g-action-edit" onClick={onEdit} disabled={loading} title="Editar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      {ativo
        ? <button className="g-action g-action-warn" onClick={onStatus} disabled={loading} title="Inativar">
            {loading ? <span className="g-mini-spinner"/> : 'Inativar'}
          </button>
        : <button className="g-action g-action-success" onClick={onStatus} disabled={loading} title="Reativar">
            {loading ? <span className="g-mini-spinner"/> : 'Reativar'}
          </button>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PESSOAS
══════════════════════════════════════════════════ */

function PessoasSection({ tipoFiltro }) {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [filtro, setFiltro] = useState(tipoFiltro || 'TODOS');
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setPessoas(await getPessoas()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleStatus = async (p) => {
    setActionId(p.id);
    try { p.ativo ? await inativarPessoa(p.id) : await reativarPessoa(p.id); await carregar(); }
    finally { setActionId(null); }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarPessoa(dados);
    else await atualizarPessoa(modal.dados.id, dados);
    setModal(null); await carregar();
  };

  let lista = filtro === 'TODOS' ? pessoas : pessoas.filter(p => p.tipo === filtro);
  if (busca.trim()) lista = lista.filter(p =>
    (p.razao_social || '').toLowerCase().includes(busca.toLowerCase()) ||
    (p.cnpj || '').includes(busca) || (p.cpf || '').includes(busca)
  );

  return (
    <div className="g-section">
      <div className="g-toolbar">
        <button className="g-btn-new" onClick={() => setModal({ modo: 'criar', dados: {} })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Cadastro
        </button>
        {!tipoFiltro && (
          <div className="g-filter-group">
            {['TODOS', 'CLIENTE-FORNECEDOR', 'FATURADO'].map(t => (
              <button key={t} className={`g-filter-btn ${filtro === t ? 'active' : ''}`} onClick={() => setFiltro(t)}>
                {t === 'TODOS' ? 'Todos' : t === 'CLIENTE-FORNECEDOR' ? 'Fornecedores' : 'Faturados'}
              </button>
            ))}
          </div>
        )}
        <div className="g-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." />
        </div>
        <span className="g-count">{lista.length} registro(s)</span>
      </div>

      {loading ? <Loader /> : lista.length === 0 ? <Empty msg="Nenhum cadastro encontrado." /> : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>ID</th><th>Tipo</th><th>Nome / Razão Social</th><th>CNPJ / CPF</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id} className={!p.ativo ? 'row-dim' : ''}>
                  <td className="td-id">#{p.id}</td>
                  <td><Pill variant={p.tipo === 'CLIENTE-FORNECEDOR' ? 'blue' : 'purple'}>{p.tipo === 'CLIENTE-FORNECEDOR' ? 'Fornecedor' : 'Faturado'}</Pill></td>
                  <td className="td-main">{p.razao_social || '—'}</td>
                  <td className="td-mono">{p.cnpj || p.cpf || '—'}</td>
                  <td><Badge ativo={p.ativo} /></td>
                  <td>
                    <RowActions ativo={p.ativo} onEdit={() => setModal({ modo: 'editar', dados: p })}
                      onStatus={() => handleStatus(p)} loading={actionId === p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ModalPessoa modo={modal.modo} dados={modal.dados} onClose={() => setModal(null)} onSalvar={handleSalvar} />}
    </div>
  );
}

function ModalPessoa({ modo, dados, onClose, onSalvar }) {
  const [form, setForm] = useState({
    tipo: dados.tipo || 'CLIENTE-FORNECEDOR', razao_social: dados.razao_social || '',
    nome_fantasia: dados.nome_fantasia || '', cnpj: dados.cnpj || '', cpf: dados.cpf || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.razao_social.trim()) { setErr('Razão Social é obrigatória.'); return; }
    setSaving(true);
    try { await onSalvar(form); }
    catch (e) { setErr(e.response?.data?.detail || 'Erro ao salvar.'); setSaving(false); }
  };

  return (
    <Modal title={modo === 'criar' ? 'Novo Cadastro de Pessoa' : 'Editar Pessoa'} onClose={onClose}>
      <div className="g-form-grid">
        <div className="g-form-group">
          <label>Tipo *</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)} disabled={modo === 'editar'}>
            <option value="CLIENTE-FORNECEDOR">Fornecedor / Cliente</option>
            <option value="FATURADO">Faturado</option>
          </select>
        </div>
        <div className="g-form-group g-form-full">
          <label>Razão Social / Nome *</label>
          <input value={form.razao_social} onChange={e => set('razao_social', e.target.value)} placeholder="Nome ou Razão Social" />
        </div>
        <div className="g-form-group g-form-full">
          <label>Nome Fantasia</label>
          <input value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} placeholder="Opcional" />
        </div>
        <div className="g-form-group">
          <label>CNPJ</label>
          <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
        </div>
        <div className="g-form-group">
          <label>CPF</label>
          <input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
        </div>
      </div>
      <FormError msg={err} />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} />
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   CLASSIFICAÇÕES
══════════════════════════════════════════════════ */

function ClassificacoesSection({ tipoFiltro }) {
  const [clfs, setClfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [modal, setModal] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setClfs(await getClassificacoes()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleStatus = async (c) => {
    setActionId(c.id);
    try { c.ativo ? await inativarClassificacao(c.id) : await reativarClassificacao(c.id); await carregar(); }
    finally { setActionId(null); }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarClassificacao(dados);
    else await atualizarClassificacao(modal.dados.id, dados);
    setModal(null); await carregar();
  };

  const lista = tipoFiltro ? clfs.filter(c => c.tipo === tipoFiltro) : clfs;

  return (
    <div className="g-section">
      <div className="g-toolbar">
        <button className="g-btn-new" onClick={() => setModal({ modo: 'criar', dados: { tipo: tipoFiltro || 'DESPESA' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Classificação
        </button>
        <span className="g-count">{lista.length} registro(s)</span>
      </div>

      {loading ? <Loader /> : lista.length === 0 ? <Empty msg="Nenhuma classificação cadastrada." /> : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>ID</th><th>Tipo</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id} className={!c.ativo ? 'row-dim' : ''}>
                  <td className="td-id">#{c.id}</td>
                  <td><Pill variant={c.tipo === 'DESPESA' ? 'red' : 'green'}>{c.tipo}</Pill></td>
                  <td className="td-main">{c.descricao}</td>
                  <td><Badge ativo={c.ativo} /></td>
                  <td>
                    <RowActions ativo={c.ativo} onEdit={() => setModal({ modo: 'editar', dados: c })}
                      onStatus={() => handleStatus(c)} loading={actionId === c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ModalClassificacao modo={modal.modo} dados={modal.dados} tipoFixo={tipoFiltro} onClose={() => setModal(null)} onSalvar={handleSalvar} />}
    </div>
  );
}

function ModalClassificacao({ modo, dados, tipoFixo, onClose, onSalvar }) {
  const [form, setForm] = useState({ tipo: dados.tipo || tipoFixo || 'DESPESA', descricao: dados.descricao || '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!form.descricao.trim()) { setErr('Descrição é obrigatória.'); return; }
    setSaving(true);
    try { await onSalvar(form); }
    catch (e) { setErr(e.response?.data?.detail || 'Erro ao salvar.'); setSaving(false); }
  };

  return (
    <Modal title={modo === 'criar' ? 'Nova Classificação' : 'Editar Classificação'} onClose={onClose}>
      <div className="g-form-grid">
        <div className="g-form-group">
          <label>Tipo *</label>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} disabled={!!tipoFixo}>
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </select>
        </div>
        <div className="g-form-group g-form-full">
          <label>Descrição *</label>
          <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex.: Manutenção e Operação" />
        </div>
      </div>
      <FormError msg={err} />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} />
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   MOVIMENTOS
══════════════════════════════════════════════════ */

function MovimentosSection({ tipoFiltro }) {
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [modal, setModal] = useState(null);
  const [pessoas, setPessoas] = useState([]);
  const [classificacoes, setClassificacoes] = useState([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [movs, pess, clfs] = await Promise.all([getMovimentos(), getPessoas(), getClassificacoes()]);
      setMovimentos(movs); setPessoas(pess); setClassificacoes(clfs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const verDetalhe = async (id) => {
    if (detalhe?.id === id) { setDetalhe(null); return; }
    setLoadingDet(id);
    try { setDetalhe(await getMovimento(id)); } finally { setLoadingDet(false); }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarMovimento(dados);
    else await atualizarMovimento(modal.dados.id, dados);
    setModal(null); await carregar();
  };

  const lista = tipoFiltro ? movimentos.filter(m => m.tipo === tipoFiltro) : movimentos;

  return (
    <div className="g-section">
      <div className="g-toolbar">
        <button className="g-btn-new" onClick={() => setModal({ modo: 'criar', dados: { tipo: tipoFiltro || 'APAGAR' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Movimento
        </button>
        <span className="g-count">{lista.length} movimento(s)</span>
      </div>

      {loading ? <Loader /> : lista.length === 0 ? <Empty msg="Nenhum movimento lançado." /> : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>ID</th><th>Tipo</th><th>Nº NF</th><th>Data NF</th><th>Valor Total</th><th>Lançado em</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map(m => (
                <>
                  <tr key={m.id}>
                    <td className="td-id">#{m.id}</td>
                    <td><Pill variant={m.tipo === 'APAGAR' ? 'red' : 'green'}>{m.tipo === 'APAGAR' ? 'A PAGAR' : 'A RECEBER'}</Pill></td>
                    <td>{m.numero_nf || '—'}</td>
                    <td>{m.data_nf || '—'}</td>
                    <td className="td-valor">{formatCurrency(m.valor_total)}</td>
                    <td>{m.criado_em ? new Date(m.criado_em).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <div className="g-row-actions">
                        <button className="g-action g-action-default" onClick={() => verDetalhe(m.id)} title="Ver detalhes">
                          {loadingDet === m.id ? <span className="g-mini-spinner"/> :
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {detalhe?.id === m.id
                                ? <polyline points="18 15 12 9 6 15"/>
                                : <polyline points="6 9 12 15 18 9"/>}
                            </svg>
                          }
                        </button>
                        <button className="g-action g-action-edit" onClick={() => setModal({ modo: 'editar', dados: m })} title="Editar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {detalhe?.id === m.id && (
                    <tr key={`det-${m.id}`} className="row-detalhe-tr">
                      <td colSpan={7}>
                        <div className="mov-detalhe">
                          <div className="mov-det-grid">
                            <div className="mov-det-bloco">
                              <div className="mov-det-label">Fornecedor</div>
                              <div className="mov-det-val">{detalhe.fornecedor?.razao_social || '—'}</div>
                              <div className="mov-det-sub">{detalhe.fornecedor?.cnpj || ''}</div>
                            </div>
                            <div className="mov-det-bloco">
                              <div className="mov-det-label">Faturado</div>
                              <div className="mov-det-val">{detalhe.faturado?.razao_social || '—'}</div>
                              <div className="mov-det-sub">{detalhe.faturado?.cpf || ''}</div>
                            </div>
                            <div className="mov-det-bloco">
                              <div className="mov-det-label">Classificações</div>
                              {detalhe.classificacoes?.length > 0
                                ? detalhe.classificacoes.map(c => <span key={c.id} className="mov-clf-tag">{c.descricao}</span>)
                                : <div className="mov-det-val">—</div>}
                            </div>
                          </div>
                          {detalhe.descricao_produtos && (
                            <div className="mov-det-desc">
                              <div className="mov-det-label">Produtos / Serviços</div>
                              <div className="mov-det-val">{detalhe.descricao_produtos}</div>
                            </div>
                          )}
                          {detalhe.parcelas?.length > 0 && (
                            <div>
                              <div className="mov-det-label" style={{marginBottom:8}}>Parcelas ({detalhe.parcelas.length})</div>
                              <table className="parc-table">
                                <thead><tr><th>Parcela</th><th>Valor</th><th>Vencimento</th></tr></thead>
                                <tbody>
                                  {detalhe.parcelas.map(p => (
                                    <tr key={p.id}>
                                      <td>{p.numero_parcela}ª</td>
                                      <td className="td-valor">{formatCurrency(p.valor)}</td>
                                      <td>{p.data_vencimento || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalMovimento modo={modal.modo} dados={modal.dados} pessoas={pessoas}
          classificacoes={classificacoes} tipoFixo={tipoFiltro} onClose={() => setModal(null)} onSalvar={handleSalvar} />
      )}
    </div>
  );
}

function ModalMovimento({ modo, dados, pessoas, classificacoes, tipoFixo, onClose, onSalvar }) {
  const [form, setForm] = useState({
    tipo: dados.tipo || tipoFixo || 'APAGAR',
    numero_nf: dados.numero_nf || '', data_nf: dados.data_nf || '',
    valor_total: dados.valor_total ?? '', descricao_produtos: dados.descricao_produtos || '',
    pessoa_id: dados.pessoa_id || '', faturado_id: dados.faturado_id || '',
    classificacao_ids: [], parcelas: [{ valor: '', data_vencimento: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [loadingDet, setLoadingDet] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (modo === 'editar' && dados.id) {
      setLoadingDet(true);
      getMovimento(dados.id).then(det => {
        setForm(f => ({
          ...f,
          classificacao_ids: det.classificacoes?.map(c => c.id) || [],
          parcelas: det.parcelas?.length > 0
            ? det.parcelas.map(p => ({ valor: p.valor ?? '', data_vencimento: p.data_vencimento || '' }))
            : [{ valor: '', data_vencimento: '' }],
        }));
      }).finally(() => setLoadingDet(false));
    }
  }, []);

  const toggleClf = (id) => setForm(f => ({
    ...f, classificacao_ids: f.classificacao_ids.includes(id)
      ? f.classificacao_ids.filter(x => x !== id)
      : [...f.classificacao_ids, id],
  }));

  const setParcela = (i, k, v) => setForm(f => {
    const parcelas = [...f.parcelas]; parcelas[i] = { ...parcelas[i], [k]: v }; return { ...f, parcelas };
  });

  const addParcela = () => setForm(f => ({ ...f, parcelas: [...f.parcelas, { valor: '', data_vencimento: '' }] }));
  const removeParcela = (i) => setForm(f => ({ ...f, parcelas: f.parcelas.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    const payload = {
      ...form,
      valor_total: form.valor_total !== '' ? parseFloat(form.valor_total) : null,
      pessoa_id: form.pessoa_id !== '' ? parseInt(form.pessoa_id) : null,
      faturado_id: form.faturado_id !== '' ? parseInt(form.faturado_id) : null,
      parcelas: form.parcelas.map(p => ({ valor: p.valor !== '' ? parseFloat(p.valor) : null, data_vencimento: p.data_vencimento || null })),
    };
    setSaving(true);
    try { await onSalvar(payload); }
    catch (e) { setErr(e.response?.data?.detail || 'Erro ao salvar.'); setSaving(false); }
  };

  const tipoClf = form.tipo === 'APAGAR' ? 'DESPESA' : 'RECEITA';
  const clfsFiltered = classificacoes.filter(c => c.tipo === tipoClf && c.ativo);
  const fornecedores = pessoas.filter(p => p.tipo === 'CLIENTE-FORNECEDOR');
  const faturados = pessoas.filter(p => p.tipo === 'FATURADO');

  return (
    <Modal title={modo === 'criar' ? 'Novo Movimento' : 'Editar Movimento'} onClose={onClose} wide>
      {loadingDet ? <Loader /> : (
        <>
          <div className="g-form-grid">
            <div className="g-form-group">
              <label>Tipo *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} disabled={!!tipoFixo}>
                <option value="APAGAR">Contas a Pagar</option>
                <option value="ARECEBER">Contas a Receber</option>
              </select>
            </div>
            <div className="g-form-group">
              <label>Nº NF</label>
              <input value={form.numero_nf} onChange={e => set('numero_nf', e.target.value)} placeholder="Número da NF" />
            </div>
            <div className="g-form-group">
              <label>Data NF</label>
              <input value={form.data_nf} onChange={e => set('data_nf', e.target.value)} placeholder="DD/MM/AAAA" />
            </div>
            <div className="g-form-group">
              <label>Valor Total</label>
              <input type="number" step="0.01" value={form.valor_total} onChange={e => set('valor_total', e.target.value)} placeholder="0,00" />
            </div>
            <div className="g-form-group">
              <label>Fornecedor / Cliente</label>
              <select value={form.pessoa_id} onChange={e => set('pessoa_id', e.target.value)}>
                <option value="">— selecione —</option>
                {fornecedores.map(p => <option key={p.id} value={p.id}>{p.razao_social}</option>)}
              </select>
            </div>
            <div className="g-form-group">
              <label>Faturado</label>
              <select value={form.faturado_id} onChange={e => set('faturado_id', e.target.value)}>
                <option value="">— selecione —</option>
                {faturados.map(p => <option key={p.id} value={p.id}>{p.razao_social}</option>)}
              </select>
            </div>
            <div className="g-form-group g-form-full">
              <label>Descrição / Produtos</label>
              <textarea value={form.descricao_produtos} onChange={e => set('descricao_produtos', e.target.value)} rows={2} placeholder="Descrição dos produtos ou serviços" />
            </div>
          </div>

          <div className="g-form-section">
            <div className="g-form-section-title">Classificações de {tipoClf === 'DESPESA' ? 'Despesa' : 'Receita'}</div>
            {clfsFiltered.length === 0
              ? <div className="g-hint">Nenhuma classificação ativa. Cadastre primeiro na seção de classificações.</div>
              : <div className="g-clf-list">
                  {clfsFiltered.map(c => (
                    <label key={c.id} className={`g-clf-item ${form.classificacao_ids.includes(c.id) ? 'g-clf-checked' : ''}`}>
                      <input type="checkbox" checked={form.classificacao_ids.includes(c.id)} onChange={() => toggleClf(c.id)} />
                      {c.descricao}
                    </label>
                  ))}
                </div>
            }
          </div>

          <div className="g-form-section">
            <div className="g-form-section-title">Parcelas</div>
            {form.parcelas.map((p, i) => (
              <div key={i} className="g-parcela-row">
                <span className="g-parcela-num">{i + 1}ª</span>
                <div className="g-form-group" style={{flex:1}}>
                  <label>Valor</label>
                  <input type="number" step="0.01" value={p.valor} onChange={e => setParcela(i, 'valor', e.target.value)} placeholder="0,00" />
                </div>
                <div className="g-form-group" style={{flex:1}}>
                  <label>Vencimento</label>
                  <input value={p.data_vencimento} onChange={e => setParcela(i, 'data_vencimento', e.target.value)} placeholder="DD/MM/AAAA" />
                </div>
                {form.parcelas.length > 1 && (
                  <button className="g-btn-remove-parc" onClick={() => removeParcela(i)} title="Remover">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            ))}
            <button className="g-btn-add-parc" onClick={addParcela}>+ Adicionar Parcela</button>
          </div>

          <FormError msg={err} />
          <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} />
        </>
      )}
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   PARCELAS
══════════════════════════════════════════════════ */

function ParcelasSection() {
  const [parcelas, setParcelas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getParcelas().then(setParcelas).finally(() => setLoading(false)); }, []);

  return (
    <div className="g-section">
      <div className="g-toolbar">
        <span className="g-count">{parcelas.length} parcela(s)</span>
      </div>
      {loading ? <Loader /> : parcelas.length === 0 ? <Empty msg="Nenhuma parcela cadastrada." /> : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>ID</th><th>Movimento</th><th>Nº Parcela</th><th>Valor</th><th>Vencimento</th></tr></thead>
            <tbody>
              {parcelas.map(p => (
                <tr key={p.id}>
                  <td className="td-id">#{p.id}</td>
                  <td>Mov. #{p.movimento_id}</td>
                  <td>{p.numero_parcela}ª parcela</td>
                  <td className="td-valor">{formatCurrency(p.valor)}</td>
                  <td>{p.data_vencimento || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROUTER
══════════════════════════════════════════════════ */

const TITLES = {
  fornecedores: 'Fornecedores / Clientes',
  faturados:    'Faturados',
  despesas:     'Tipos de Despesa',
  receitas:     'Tipos de Receita',
  apagar:       'Contas a Pagar',
  areceber:     'Contas a Receber',
  parcelas:     'Parcelas',
};

export default function GestaoSection({ secao }) {
  return (
    <div>
      <div className="g-page-header">
        <h1 className="section-title">{TITLES[secao]}</h1>
      </div>
      {secao === 'fornecedores' && <PessoasSection />}
      {secao === 'faturados'    && <PessoasSection tipoFiltro="FATURADO" />}
      {secao === 'despesas'     && <ClassificacoesSection tipoFiltro="DESPESA" />}
      {secao === 'receitas'     && <ClassificacoesSection tipoFiltro="RECEITA" />}
      {secao === 'apagar'       && <MovimentosSection tipoFiltro="APAGAR" />}
      {secao === 'areceber'     && <MovimentosSection tipoFiltro="ARECEBER" />}
      {secao === 'parcelas'     && <ParcelasSection />}
    </div>
  );
}
