import { useState } from 'react';
import {
  buscarContas, todosContas, criarConta, atualizarConta, inativarConta, reativarConta,
  parsearErroAPI,
} from '../services/api';
import './GestaoSection.css';

/* ── Utilidades ───────────────────────────────────── */

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

function tipoLabel(tipo) {
  switch (tipo) {
    case 'CORRENTE': return 'Conta Corrente';
    case 'POUPANCA': return 'Poupança';
    case 'CAIXA': return 'Caixa';
    case 'CARTAO_CREDITO': return 'Cartão de Crédito';
    default: return tipo || '—';
  }
}

function tipoVariant(tipo) {
  switch (tipo) {
    case 'CORRENTE': return 'blue';
    case 'POUPANCA': return 'green';
    case 'CAIXA': return 'purple';
    case 'CARTAO_CREDITO': return 'red';
    default: return 'blue';
  }
}

/* ── Sortable column header ──────────────────────── */

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

/* ── Modal helpers ───────────────────────────────── */

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
        ? <button className="g-action g-action-warn" onClick={onStatus} disabled={loading} title="Excluir (inativar)">
            {loading ? <span className="g-mini-spinner"/> : 'Excluir'}
          </button>
        : <button className="g-action g-action-success" onClick={onStatus} disabled={loading} title="Reativar">
            {loading ? <span className="g-mini-spinner"/> : 'Reativar'}
          </button>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CONTAS
══════════════════════════════════════════════════ */

const TIPOS = ['CORRENTE', 'POUPANCA', 'CAIXA', 'CARTAO_CREDITO'];

export default function ContasSection() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [modal, setModal] = useState(null);

  const [statusFiltro, setStatusFiltro] = useState('TODOS'); // TODOS | ATIVOS | INATIVOS
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [nomeFilter, setNomeFilter] = useState('');
  const [bancoFilter, setBancoFilter] = useState('');

  const [colSort, setColSort] = useState('criado_em');
  const [colDir, setColDir] = useState('desc');
  // lastAction: null | 'buscar' | 'todos'
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
    return undefined; // TODOS
  };

  const runBuscar = async (sort = colSort, dir = colDir) => {
    setLoading(true);
    try {
      const params = omitEmpty({
        q: nomeFilter.trim(),
        banco: bancoFilter.trim(),
        tipo: filtroTipo === 'TODOS' ? '' : filtroTipo,
        ativo: statusToAtivo(statusFiltro),
        order_by: sort,
        order_dir: dir,
      });
      const data = await buscarContas(params);
      setLista(Array.isArray(data) ? data : []);
      setLastAction('buscar');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao buscar contas.');
    } finally {
      setLoading(false);
    }
  };

  const runLimpar = () => {
    setStatusFiltro('TODOS');
    setFiltroTipo('TODOS');
    setNomeFilter('');
    setBancoFilter('');
    setLista([]);
    setLastAction(null);
  };

  const runTodos = async () => {
    setLoading(true);
    try {
      const data = await todosContas();
      setLista(Array.isArray(data) ? data : []);
      setLastAction('todos');
    } catch (e) {
      alert(parsearErroAPI(e) || 'Erro ao listar contas.');
    } finally {
      setLoading(false);
    }
  };

  const replayLast = async (sort = colSort, dir = colDir) => {
    if (lastAction === 'buscar') return runBuscar(sort, dir);
    if (lastAction === 'todos') return runTodos();
  };

  const handleSort = (field) => {
    let nextDir;
    if (colSort === field) {
      nextDir = colDir === 'desc' ? 'asc' : 'desc';
    } else {
      nextDir = 'desc';
    }
    setColSort(field);
    setColDir(nextDir);
    if (lastAction) replayLast(field, nextDir);
  };

  const handleStatus = async (c) => {
    const acao = c.ativo ? 'inativar' : 'reativar';
    const mensagem = c.ativo
      ? `Deseja realmente excluir (inativar) a conta "${c.nome}"?`
      : `Deseja reativar a conta "${c.nome}"?`;
    if (!window.confirm(mensagem)) return;
    setActionId(c.id);
    try {
      if (c.ativo) await inativarConta(c.id);
      else await reativarConta(c.id);
      await replayLast();
    } catch (e) {
      alert(parsearErroAPI(e) || `Erro ao ${acao} conta.`);
    } finally {
      setActionId(null);
    }
  };

  const handleSalvar = async (dados) => {
    if (modal.modo === 'criar') await criarConta(dados);
    else await atualizarConta(modal.dados.id, dados);
    setModal(null);
    await replayLast();
  };

  return (
    <div>
      <div className="g-page-header">
        <h1 className="section-title">Contas Financeiras</h1>
      </div>

      <div className="g-section">
        {/* Linha 1 — filtros */}
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

          <select
            className="g-filter-select"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            title="Tipo"
          >
            <option value="TODOS">Todos os tipos</option>
            {TIPOS.map(t => (
              <option key={t} value={t}>{tipoLabel(t)}</option>
            ))}
          </select>

          <input
            className="g-filter-input"
            value={nomeFilter}
            onChange={e => setNomeFilter(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
            placeholder="Nome"
          />

          <input
            className="g-filter-input"
            value={bancoFilter}
            onChange={e => setBancoFilter(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runBuscar(); }}
            placeholder="Banco"
          />
        </div>

        {/* Linha 2 — ações */}
        <div className="g-toolbar">
          <button className="g-btn-new" onClick={() => setModal({ modo: 'criar', dados: {} })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova Conta
          </button>

          <button className="g-btn-new" onClick={() => runBuscar()} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar
          </button>
          <button className="g-btn-new" onClick={runTodos} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            Todos
          </button>
          <button className="g-btn-clear" onClick={runLimpar} disabled={loading} title="Limpar filtros e tabela">
            Limpar
          </button>

          <span className="g-count">{lista.length} registro(s)</span>
        </div>

        {loading ? <Loader /> : lista.length === 0 ? (
          <Empty msg="Nenhuma conta carregada. Use Buscar ou Todos para listar contas." />
        ) : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr>
                  <SortHeader field="nome" label="Nome" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <SortHeader field="tipo" label="Tipo" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <SortHeader field="banco" label="Banco" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <SortHeader field="agencia" label="Agência" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <SortHeader field="numero" label="Número" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <SortHeader field="saldo_inicial" label="Saldo Inicial" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <SortHeader field="ativo" label="Status" colSort={colSort} colDir={colDir} onSort={handleSort} />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(c => (
                  <tr key={c.id} className={!c.ativo ? 'row-dim' : ''}>
                    <td className="td-main">{c.nome || '—'}</td>
                    <td><Pill variant={tipoVariant(c.tipo)}>{tipoLabel(c.tipo)}</Pill></td>
                    <td>{c.banco || '—'}</td>
                    <td className="td-mono">{c.agencia || '—'}</td>
                    <td className="td-mono">{c.numero || '—'}</td>
                    <td className="td-valor">{formatCurrency(c.saldo_inicial)}</td>
                    <td><Badge ativo={c.ativo} /></td>
                    <td>
                      <RowActions
                        ativo={c.ativo}
                        onEdit={() => setModal({ modo: 'editar', dados: c })}
                        onStatus={() => handleStatus(c)}
                        loading={actionId === c.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <ModalConta
            modo={modal.modo}
            dados={modal.dados}
            onClose={() => setModal(null)}
            onSalvar={handleSalvar}
          />
        )}
      </div>
    </div>
  );
}

function ModalConta({ modo, dados, onClose, onSalvar }) {
  const [form, setForm] = useState({
    nome: dados.nome || '',
    tipo: dados.tipo || 'CORRENTE',
    banco: dados.banco || '',
    agencia: dados.agencia || '',
    numero: dados.numero || '',
    saldo_inicial: dados.saldo_inicial ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nome.trim()) { setErr('Nome é obrigatório.'); return; }
    if (!form.tipo) { setErr('Tipo é obrigatório.'); return; }

    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      banco: form.banco.trim() || null,
      agencia: form.agencia.trim() || null,
      numero: form.numero.trim() || null,
      saldo_inicial: form.saldo_inicial === '' || form.saldo_inicial === null
        ? 0
        : parseFloat(form.saldo_inicial),
    };

    setSaving(true);
    try {
      await onSalvar(payload);
    } catch (e) {
      setErr(parsearErroAPI(e) || 'Erro ao salvar.');
      setSaving(false);
    }
  };

  return (
    <Modal title={modo === 'criar' ? 'Nova Conta Financeira' : 'Editar Conta Financeira'} onClose={onClose}>
      <div className="g-form-grid">
        <div className="g-form-group g-form-full">
          <label>Nome *</label>
          <input
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
            placeholder='Ex.: Banco do Brasil 12345-6'
          />
        </div>
        <div className="g-form-group">
          <label>Tipo *</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t} value={t}>{tipoLabel(t)}</option>)}
          </select>
        </div>
        <div className="g-form-group">
          <label>Banco</label>
          <input
            value={form.banco}
            onChange={e => set('banco', e.target.value)}
            placeholder="Ex.: Banco do Brasil"
          />
        </div>
        <div className="g-form-group">
          <label>Agência</label>
          <input
            value={form.agencia}
            onChange={e => set('agencia', e.target.value)}
            placeholder="0000"
          />
        </div>
        <div className="g-form-group">
          <label>Número</label>
          <input
            value={form.numero}
            onChange={e => set('numero', e.target.value)}
            placeholder="00000-0"
          />
        </div>
        <div className="g-form-group g-form-full">
          <label>Saldo Inicial</label>
          <input
            type="number"
            step="0.01"
            value={form.saldo_inicial}
            onChange={e => set('saldo_inicial', e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      <FormError msg={err} />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} />
    </Modal>
  );
}
