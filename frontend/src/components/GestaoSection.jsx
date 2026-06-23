import { useState, useEffect } from 'react';
import {
  getPessoas, criarPessoa, atualizarPessoa, inativarPessoa, reativarPessoa,
  buscarPessoas, todasPessoas,
  getClassificacoes, criarClassificacao, atualizarClassificacao, inativarClassificacao,
  reativarClassificacao,
  buscarClassificacoes, todasClassificacoes,
  getMovimento, criarMovimento, atualizarMovimento,
  buscarMovimentos, todosMovimentos,
  getParcelas,
  parsearErroAPI,
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

function formatarData(data) {
  if (!data) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return data;
}

function formatarDatetime(dt) {
  if (!dt) return '—';
  const datePart = String(dt).split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [ano, mes, dia] = datePart.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return dt;
}

function statusParcela(dataVencimento) {
  if (!dataVencimento) return null;
  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) {
    date = new Date(dataVencimento + 'T12:00:00');
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataVencimento)) {
    const [d, m, y] = dataVencimento.split('/');
    date = new Date(`${y}-${m}-${d}T12:00:00`);
  } else {
    return null;
  }
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diffDias = Math.round((date - today) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return 'vencida';
  if (diffDias <= 7) return 'proxima';
  return 'ok';
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

function RowActions({ ativo, onEdit, onStatus, loading, excluirLabel = 'Excluir' }) {
  return (
    <div className="g-row-actions">
      <button className="g-action g-action-edit" onClick={onEdit} disabled={loading} title="Editar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      {ativo
        ? <button className="g-action g-action-warn" onClick={onStatus} disabled={loading} title={`${excluirLabel} (inativar)`}>
            {loading ? <span className="g-mini-spinner"/> : excluirLabel}
          </button>
        : <button className="g-action g-action-success" onClick={onStatus} disabled={loading} title="Reativar">
            {loading ? <span className="g-mini-spinner"/> : 'Reativar'}
          </button>
      }
    </div>
  );
}

function SortHeader({ field, label, colSort, colDir, onSort }) {
  const active = colSort === field;
  const arrow = active ? (colDir === 'asc' ? '▲' : '▼') : '';
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      title={`Ordenar por ${label}`}
    >
      {label} {active && <span style={{ marginLeft: 4 }}>{arrow}</span>}
    </th>
  );
}

/* ══════════════════════════════════════════════════
   PESSOAS
══════════════════════════════════════════════════ */

function PessoasSection({ tipoFiltro }) {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [statusFiltro, setStatusFiltro] = useState('TODOS'); // TODOS | ATIVOS | INATIVOS
  const [filtro, setFiltro] = useState(tipoFiltro || 'TODOS');
  const [modal, setModal] = useState(null);
  const [nomeFilter, setNomeFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');

  const [colSort, setColSort] = useState('criado_em');
  const [colDir, setColDir] = useState('desc');
  const [lastAction, setLastAction] = useState(null); // 'buscar' | 'todos' | null

  const omitEmpty = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    });
    return out;
  };

  const statusToAtivo = (s) => {
    if (s === 'ATIVOS') return true;
    if (s === 'INATIVOS') return false;
    return undefined;
  };

  const runBuscar = async (sort = colSort, dir = colDir) => {
    setLoading(true);
    try {
      const tipoParam = tipoFiltro
        ? tipoFiltro
        : (filtro === 'TODOS' ? '' : filtro);
      const params = omitEmpty({
        q: nomeFilter.trim(),
        documento: docFilter.trim(),
        tipo: tipoParam,
        ativo: statusToAtivo(statusFiltro),
        order_by: sort,
        order_dir: dir,
      });
      const data = await buscarPessoas(params);
      setPessoas(Array.isArray(data) ? data : []);
      setLastAction('buscar');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao buscar pessoas.');
    } finally {
      setLoading(false);
    }
  };

  const runTodos = async () => {
    setLoading(true);
    try {
      const data = await todasPessoas();
      let arr = Array.isArray(data) ? data : [];
      if (tipoFiltro) arr = arr.filter(p => p.tipo === tipoFiltro);
      setPessoas(arr);
      setLastAction('todos');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao listar pessoas.');
    } finally {
      setLoading(false);
    }
  };

  const runLimpar = () => {
    setStatusFiltro('TODOS');
    setFiltro(tipoFiltro || 'TODOS');
    setNomeFilter('');
    setDocFilter('');
    setPessoas([]);
    setLastAction(null);
  };

  const replayLast = async (sort = colSort, dir = colDir) => {
    if (lastAction === 'buscar') return runBuscar(sort, dir);
    if (lastAction === 'todos') return runTodos();
  };

  const handleSort = (field) => {
    let nextDir;
    if (colSort === field) nextDir = colDir === 'desc' ? 'asc' : 'desc';
    else nextDir = 'desc';
    setColSort(field);
    setColDir(nextDir);
    if (lastAction) replayLast(field, nextDir);
  };

  const handleStatus = async (p) => {
    const mensagem = p.ativo
      ? `Deseja realmente excluir (inativar) "${p.razao_social || p.nome_fantasia || '#' + p.id}"?`
      : `Deseja reativar "${p.razao_social || p.nome_fantasia || '#' + p.id}"?`;
    if (!window.confirm(mensagem)) return;
    setActionId(p.id);
    try {
      if (p.ativo) await inativarPessoa(p.id);
      else await reativarPessoa(p.id);
      await replayLast();
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao alterar status.');
    } finally {
      setActionId(null);
    }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarPessoa(dados);
    else await atualizarPessoa(modal.dados.id, dados);
    setModal(null);
    await replayLast();
  };

  // Apenas filtro local para o botão de tipo quando NÃO se está fazendo buscar
  // (a busca via API já passa tipo). Mantém UX consistente entre Buscar/Todos.
  let lista = pessoas;
  if (!tipoFiltro && filtro !== 'TODOS') {
    lista = pessoas.filter(p => p.tipo === filtro);
  }

  return (
    <div className="g-section">
      <div className="g-filters-row">
        <select
          className="g-filter-select"
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          title="Status"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVOS">Apenas ativos</option>
          <option value="INATIVOS">Apenas inativos</option>
        </select>

        {!tipoFiltro && (
          <select
            className="g-filter-select"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            title="Tipo"
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="CLIENTE-FORNECEDOR">Fornecedores (CLIENTE-FORNECEDOR)</option>
            <option value="FATURADO">Faturados (FATURADO)</option>
          </select>
        )}

        <input
          className="g-filter-input"
          value={nomeFilter}
          onChange={e => setNomeFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
          placeholder="Nome"
        />
        <input
          className="g-filter-input"
          value={docFilter}
          onChange={e => setDocFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
          placeholder="CNPJ / CPF"
        />
      </div>

      <div className="g-toolbar">
        <button className="g-btn-new" onClick={() => setModal({ modo: 'criar', dados: {} })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Cadastro
        </button>
        <button className="g-btn-new" onClick={() => runBuscar()} disabled={loading}>Buscar</button>
        <button className="g-btn-new" onClick={runTodos} disabled={loading}>Todos</button>
        <button className="g-btn-clear" onClick={runLimpar} disabled={loading}>Limpar</button>
        <span className="g-count">{lista.length} registro(s)</span>
      </div>

      {loading ? <Loader /> : lista.length === 0 ? (
        <Empty msg="Nenhuma pessoa carregada. Use Buscar ou Todos para listar." />
      ) : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead>
              <tr>
                <th>ID</th>
                <SortHeader field="tipo" label="Tipo" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="razao_social" label="Razão Social" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="nome_fantasia" label="Nome Fantasia" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="cnpj" label="CNPJ / CPF" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="ativo" label="Status" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="criado_em" label="Criado em" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id} className={!p.ativo ? 'row-dim' : ''}>
                  <td className="td-id">#{p.id}</td>
                  <td><Pill variant={p.tipo === 'CLIENTE-FORNECEDOR' ? 'blue' : 'purple'}>{p.tipo === 'CLIENTE-FORNECEDOR' ? 'Fornecedor' : 'Faturado'}</Pill></td>
                  <td className="td-main">{p.razao_social || '—'}</td>
                  <td>{p.nome_fantasia || '—'}</td>
                  <td className="td-mono">{p.cnpj || p.cpf || '—'}</td>
                  <td><Badge ativo={p.ativo} /></td>
                  <td>{p.criado_em ? formatarDatetime(p.criado_em) : '—'}</td>
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
    catch (e) { setErr(parsearErroAPI(e) || 'Erro ao salvar.'); setSaving(false); }
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
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [modal, setModal] = useState(null);

  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [descFilter, setDescFilter] = useState('');
  // Filtro local de tipo (não usado se tipoFiltro está fixo)
  const [filtro, setFiltro] = useState(tipoFiltro || 'TODOS');

  const [colSort, setColSort] = useState('criado_em');
  const [colDir, setColDir] = useState('desc');
  const [lastAction, setLastAction] = useState(null);

  const omitEmpty = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    });
    return out;
  };

  const statusToAtivo = (s) => {
    if (s === 'ATIVOS') return true;
    if (s === 'INATIVOS') return false;
    return undefined;
  };

  const runBuscar = async (sort = colSort, dir = colDir) => {
    setLoading(true);
    try {
      const tipoParam = tipoFiltro
        ? tipoFiltro
        : (filtro === 'TODOS' ? '' : filtro);
      const params = omitEmpty({
        q: descFilter.trim(),
        tipo: tipoParam,
        ativo: statusToAtivo(statusFiltro),
        order_by: sort,
        order_dir: dir,
      });
      const data = await buscarClassificacoes(params);
      setClfs(Array.isArray(data) ? data : []);
      setLastAction('buscar');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao buscar classificações.');
    } finally {
      setLoading(false);
    }
  };

  const runTodos = async () => {
    setLoading(true);
    try {
      const data = await todasClassificacoes();
      let arr = Array.isArray(data) ? data : [];
      if (tipoFiltro) arr = arr.filter(c => c.tipo === tipoFiltro);
      setClfs(arr);
      setLastAction('todos');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao listar classificações.');
    } finally {
      setLoading(false);
    }
  };

  const runLimpar = () => {
    setStatusFiltro('TODOS');
    setFiltro(tipoFiltro || 'TODOS');
    setDescFilter('');
    setClfs([]);
    setLastAction(null);
  };

  const replayLast = async (sort = colSort, dir = colDir) => {
    if (lastAction === 'buscar') return runBuscar(sort, dir);
    if (lastAction === 'todos') return runTodos();
  };

  const handleSort = (field) => {
    let nextDir;
    if (colSort === field) nextDir = colDir === 'desc' ? 'asc' : 'desc';
    else nextDir = 'desc';
    setColSort(field);
    setColDir(nextDir);
    if (lastAction) replayLast(field, nextDir);
  };

  const handleStatus = async (c) => {
    const mensagem = c.ativo
      ? `Deseja realmente excluir (inativar) a classificação "${c.descricao}"?`
      : `Deseja reativar a classificação "${c.descricao}"?`;
    if (!window.confirm(mensagem)) return;
    setActionId(c.id);
    try {
      if (c.ativo) await inativarClassificacao(c.id);
      else await reativarClassificacao(c.id);
      await replayLast();
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao alterar status.');
    } finally {
      setActionId(null);
    }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarClassificacao(dados);
    else await atualizarClassificacao(modal.dados.id, dados);
    setModal(null);
    await replayLast();
  };

  // Filtro local opcional (quando tipoFiltro não está fixo via prop)
  let lista = clfs;
  if (!tipoFiltro && filtro !== 'TODOS') {
    lista = clfs.filter(c => c.tipo === filtro);
  }

  return (
    <div className="g-section">
      <div className="g-filters-row">
        <select
          className="g-filter-select"
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          title="Status"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVOS">Apenas ativos</option>
          <option value="INATIVOS">Apenas inativos</option>
        </select>

        {!tipoFiltro && (
          <select
            className="g-filter-select"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            title="Tipo"
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="DESPESA">DESPESA</option>
            <option value="RECEITA">RECEITA</option>
          </select>
        )}

        <input
          className="g-filter-input"
          value={descFilter}
          onChange={e => setDescFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
          placeholder="Descrição"
        />
      </div>

      <div className="g-toolbar">
        <button className="g-btn-new" onClick={() => setModal({ modo: 'criar', dados: { tipo: tipoFiltro || 'DESPESA' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Classificação
        </button>
        <button className="g-btn-new" onClick={() => runBuscar()} disabled={loading}>Buscar</button>
        <button className="g-btn-new" onClick={runTodos} disabled={loading}>Todos</button>
        <button className="g-btn-clear" onClick={runLimpar} disabled={loading}>Limpar</button>

        <span className="g-count">{lista.length} registro(s)</span>
      </div>

      {loading ? <Loader /> : lista.length === 0 ? (
        <Empty msg="Nenhuma classificação carregada. Use Buscar ou Todos para listar." />
      ) : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead>
              <tr>
                <th>ID</th>
                <SortHeader field="tipo" label="Tipo" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="descricao" label="Descrição" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="ativo" label="Status" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <SortHeader field="criado_em" label="Criado em" colSort={colSort} colDir={colDir} onSort={handleSort} />
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id} className={!c.ativo ? 'row-dim' : ''}>
                  <td className="td-id">#{c.id}</td>
                  <td><Pill variant={c.tipo === 'DESPESA' ? 'red' : 'green'}>{c.tipo}</Pill></td>
                  <td className="td-main">{c.descricao}</td>
                  <td><Badge ativo={c.ativo} /></td>
                  <td>{c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—'}</td>
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
    catch (e) { setErr(parsearErroAPI(e) || 'Erro ao salvar.'); setSaving(false); }
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
  const [loading, setLoading] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [modal, setModal] = useState(null);
  // Carregados lazy quando o modal abre — não fazemos fetch no mount.
  const [pessoas, setPessoas] = useState([]);
  const [classificacoes, setClassificacoes] = useState([]);
  const [refsLoaded, setRefsLoaded] = useState(false);

  // Filtros
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState(tipoFiltro || 'TODOS');
  const [numeroNfFilter, setNumeroNfFilter] = useState('');
  const [descFilter, setDescFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');

  const [colSort, setColSort] = useState('criado_em');
  const [colDir, setColDir] = useState('desc');
  const [lastAction, setLastAction] = useState(null);

  const omitEmpty = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    });
    return out;
  };

  const statusToAtivo = (s) => {
    if (s === 'ATIVOS') return true;
    if (s === 'INATIVOS') return false;
    return undefined;
  };

  const runBuscar = async (sort = colSort, dir = colDir) => {
    setLoading(true);
    try {
      const tipoParam = tipoFiltro
        ? tipoFiltro
        : (filtroTipo === 'TODOS' ? '' : filtroTipo);
      const params = omitEmpty({
        q: descFilter.trim(),
        numero_nf: numeroNfFilter.trim(),
        tipo: tipoParam,
        ativo: statusToAtivo(statusFiltro),
        data_inicio: dataInicioFilter || undefined,
        data_fim: dataFimFilter || undefined,
        order_by: sort,
        order_dir: dir,
      });
      const data = await buscarMovimentos(params);
      setMovimentos(Array.isArray(data) ? data : []);
      setLastAction('buscar');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao buscar movimentos.');
    } finally {
      setLoading(false);
    }
  };

  const runTodos = async () => {
    setLoading(true);
    try {
      const data = await todosMovimentos();
      let arr = Array.isArray(data) ? data : [];
      if (tipoFiltro) arr = arr.filter(m => m.tipo === tipoFiltro);
      setMovimentos(arr);
      setLastAction('todos');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao listar movimentos.');
    } finally {
      setLoading(false);
    }
  };

  const runLimpar = () => {
    setStatusFiltro('TODOS');
    setFiltroTipo(tipoFiltro || 'TODOS');
    setNumeroNfFilter('');
    setDescFilter('');
    setDataInicioFilter('');
    setDataFimFilter('');
    setMovimentos([]);
    setLastAction(null);
  };

  const replayLast = async (sort = colSort, dir = colDir) => {
    if (lastAction === 'buscar') return runBuscar(sort, dir);
    if (lastAction === 'todos') return runTodos();
  };

  const handleSort = (field) => {
    let nextDir;
    if (colSort === field) nextDir = colDir === 'desc' ? 'asc' : 'desc';
    else nextDir = 'desc';
    setColSort(field);
    setColDir(nextDir);
    if (lastAction) replayLast(field, nextDir);
  };

  // Carrega pessoas/classificações sob demanda, só quando o modal abre.
  const ensureRefs = async () => {
    if (refsLoaded) return;
    try {
      const [pess, clfs] = await Promise.all([getPessoas(), getClassificacoes()]);
      setPessoas(pess || []);
      setClassificacoes(clfs || []);
      setRefsLoaded(true);
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao carregar dados de apoio para o cadastro.');
    }
  };

  const abrirNovoModal = async () => {
    await ensureRefs();
    setModal({ modo: 'criar', dados: { tipo: tipoFiltro || 'APAGAR' } });
  };

  const abrirEditarModal = async (m) => {
    await ensureRefs();
    setModal({ modo: 'editar', dados: m });
  };

  const verDetalhe = async (id) => {
    if (detalhe?.id === id) { setDetalhe(null); return; }
    setLoadingDet(id);
    try { setDetalhe(await getMovimento(id)); } finally { setLoadingDet(false); }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarMovimento(dados);
    else await atualizarMovimento(modal.dados.id, dados);
    setModal(null);
    await replayLast();
  };

  const lista = movimentos;

  return (
    <div className="g-section">
      <div className="g-filters-row">
        <select
          className="g-filter-select"
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          title="Status"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVOS">Apenas ativos</option>
          <option value="INATIVOS">Apenas inativos</option>
        </select>

        {!tipoFiltro && (
          <select
            className="g-filter-select"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            title="Tipo"
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="APAGAR">A Pagar (APAGAR)</option>
            <option value="ARECEBER">A Receber (ARECEBER)</option>
          </select>
        )}

        <input
          className="g-filter-input"
          value={numeroNfFilter}
          onChange={e => setNumeroNfFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
          placeholder="Nº NF"
        />
        <input
          className="g-filter-input"
          value={descFilter}
          onChange={e => setDescFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
          placeholder="Descrição"
        />
        <input
          type="date"
          className="g-filter-input"
          value={dataInicioFilter}
          onChange={e => setDataInicioFilter(e.target.value)}
          title="Data NF — de"
        />
        <input
          type="date"
          className="g-filter-input"
          value={dataFimFilter}
          onChange={e => setDataFimFilter(e.target.value)}
          title="Data NF — até"
        />
      </div>

      <div className="g-toolbar">
        <button className="g-btn-new" onClick={abrirNovoModal}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Movimento
        </button>
        <button className="g-btn-new" onClick={() => runBuscar()} disabled={loading}>Buscar</button>
        <button className="g-btn-new" onClick={runTodos} disabled={loading}>Todos</button>
        <button className="g-btn-clear" onClick={runLimpar} disabled={loading}>Limpar</button>
        <span className="g-count">{lista.length} movimento(s)</span>
      </div>

      {loading ? <Loader /> : lista.length === 0 ? (
        <Empty msg="Nenhum movimento carregado. Use Buscar ou Todos para listar." />
      ) : (
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr>
              <SortHeader field="id" label="ID" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <SortHeader field="tipo" label="Tipo" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <SortHeader field="numero_nf" label="Nº NF" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <SortHeader field="data_nf" label="Data NF" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <SortHeader field="valor_total" label="Valor Total" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <SortHeader field="ativo" label="Status" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <SortHeader field="criado_em" label="Lançado em" colSort={colSort} colDir={colDir} onSort={handleSort} />
              <th>Ações</th>
            </tr></thead>
            <tbody>
              {lista.map(m => (
                <>
                  <tr key={m.id} className={m.ativo === false ? 'row-dim' : ''}>
                    <td className="td-id">#{m.id}</td>
                    <td><Pill variant={m.tipo === 'APAGAR' ? 'red' : 'green'}>{m.tipo === 'APAGAR' ? 'A PAGAR' : 'A RECEBER'}</Pill></td>
                    <td>{m.numero_nf || '—'}</td>
                    <td>{formatarData(m.data_nf)}</td>
                    <td className="td-valor">{formatCurrency(m.valor_total)}</td>
                    <td><Badge ativo={m.ativo !== false} /></td>
                    <td>{formatarDatetime(m.criado_em)}</td>
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
                        <button className="g-action g-action-edit" onClick={() => abrirEditarModal(m)} title="Editar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {detalhe?.id === m.id && (
                    <tr key={`det-${m.id}`} className="row-detalhe-tr">
                      <td colSpan={8}>
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
                            <div className="parc-detalhe-wrap">
                              <div className="mov-det-label" style={{marginBottom:8}}>
                                Parcelas ({detalhe.parcelas.length})
                              </div>
                              <table className="parc-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Valor</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detalhe.parcelas.map(p => {
                                    const st = statusParcela(p.data_vencimento);
                                    return (
                                      <tr key={p.id} className={st === 'vencida' ? 'parc-row-vencida' : ''}>
                                        <td className="parc-num">{p.numero_parcela}ª</td>
                                        <td className="td-valor">{formatCurrency(p.valor)}</td>
                                        <td>{formatarData(p.data_vencimento)}</td>
                                        <td>
                                          {st === 'vencida' && <span className="parc-badge vencida">Vencida</span>}
                                          {st === 'proxima' && <span className="parc-badge proxima">A vencer</span>}
                                          {st === 'ok' && <span className="parc-badge ok">Em dia</span>}
                                          {!st && <span className="parc-badge none">—</span>}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="parc-total-row">
                                    <td colSpan={2} className="td-valor parc-total-label">
                                      Total: {formatCurrency(detalhe.parcelas.reduce((s, p) => s + (p.valor || 0), 0))}
                                    </td>
                                    <td colSpan={2} />
                                  </tr>
                                </tfoot>
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
  const [distQtd, setDistQtd] = useState('');
  const [distDataInicio, setDistDataInicio] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDistribuir = () => {
    const n = parseInt(distQtd);
    const valorTotal = parseFloat(form.valor_total);
    if (!n || n < 1 || !valorTotal) return;
    const valorUnit = valorTotal / n;
    const base = distDataInicio ? new Date(distDataInicio + 'T12:00:00') : new Date();
    const parcelas = Array.from({ length: n }, (_, i) => {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { valor: valorUnit.toFixed(2), data_vencimento: iso };
    });
    setForm(f => ({ ...f, parcelas }));
  };

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

            {/* Distribuição automática */}
            <div className="g-dist-bar">
              <input
                type="number" min="1" max="60"
                className="g-dist-input"
                value={distQtd}
                onChange={e => setDistQtd(e.target.value)}
                placeholder="Qtd."
              />
              <input
                type="date"
                className="g-dist-input"
                value={distDataInicio}
                onChange={e => setDistDataInicio(e.target.value)}
                title="Data do 1º vencimento"
              />
              <button
                type="button"
                className="g-btn-distribuir"
                onClick={handleDistribuir}
                disabled={!distQtd || !form.valor_total}
                title="Distribui o valor total em parcelas mensais iguais"
              >
                Distribuir
              </button>
            </div>

            {/* Linhas de parcela */}
            {form.parcelas.map((p, i) => (
              <div key={i} className="g-parcela-row">
                <span className="g-parcela-num">{i + 1}ª</span>
                <div className="g-form-group" style={{flex:1}}>
                  <label>Valor</label>
                  <input type="number" step="0.01" value={p.valor} onChange={e => setParcela(i, 'valor', e.target.value)} placeholder="0,00" />
                </div>
                <div className="g-form-group" style={{flex:1}}>
                  <label>Vencimento</label>
                  <input type="date" value={p.data_vencimento} onChange={e => setParcela(i, 'data_vencimento', e.target.value)} />
                </div>
                {form.parcelas.length > 1 && (
                  <button className="g-btn-remove-parc" onClick={() => removeParcela(i)} title="Remover">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            ))}

            {/* Totalizador */}
            {(() => {
              const totalParc = form.parcelas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
              const totalNF = parseFloat(form.valor_total) || 0;
              const diff = Math.abs(totalParc - totalNF);
              const ok = totalNF > 0 && diff < 0.01;
              return (
                <div className={`g-parc-total ${ok ? 'ok' : totalNF > 0 ? 'diverge' : ''}`}>
                  Total das parcelas: <strong>{formatCurrency(totalParc)}</strong>
                  {totalNF > 0 && !ok && (
                    <span className="g-parc-diff"> · diferença de {formatCurrency(diff)} em relação ao valor total</span>
                  )}
                  {ok && <span className="g-parc-ok"> ✓ bate com o valor total</span>}
                </div>
              );
            })()}

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
                  <td>{formatarData(p.data_vencimento)}</td>
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
