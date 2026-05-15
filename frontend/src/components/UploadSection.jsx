import { useState, useRef } from 'react';
import { extractNotaFiscal, lancarNotaFiscal } from '../services/api';
import './UploadSection.css';

/* ── JsonViewer ──────────────────────────────────────── */

function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(data, null, 2);

  const colorize = (json) =>
    json.replace(
      /(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (m) => {
        let cls = 'jn';
        if (/^"/.test(m)) cls = /:$/.test(m) ? 'jk' : 'js';
        else if (/true|false/.test(m)) cls = 'jb';
        else if (/null/.test(m)) cls = 'jnl';
        return `<span class="${cls}">${m}</span>`;
      }
    );

  const copy = () => {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="json-viewer">
      <div className="json-toolbar">
        <span className="json-label">JSON</span>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
          {copied ? '✓ Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre className="json-pre" dangerouslySetInnerHTML={{ __html: colorize(jsonStr) }} />
    </div>
  );
}

/* ── FormattedView ───────────────────────────────────── */

function Field({ label, value, mono, highlight }) {
  return (
    <div className="fv-field">
      <span className="fv-label">{label}</span>
      <span className={`fv-value ${mono ? 'fv-mono' : ''} ${highlight ? 'fv-highlight' : ''}`}>
        {value ?? <em className="fv-empty">Não informado</em>}
      </span>
    </div>
  );
}

function FormattedView({ data }) {
  const { fornecedor, faturado, numero_nota_fiscal, data_emissao, descricao_produtos, valor_total, parcelas, classificacoes_despesa } = data;
  const fmt = (v) => v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : null;
  const fmtDate = (d) => { if (!d) return null; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };

  return (
    <div className="fv-grid">
      <div className="fv-card">
        <div className="fv-card-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          Fornecedor
        </div>
        <div className="fv-fields">
          <Field label="Razão Social" value={fornecedor?.razao_social} />
          <Field label="Nome Fantasia" value={fornecedor?.fantasia} />
          <Field label="CNPJ" value={fornecedor?.cnpj} mono />
        </div>
      </div>

      <div className="fv-card">
        <div className="fv-card-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Faturado
        </div>
        <div className="fv-fields">
          <Field label="Nome" value={faturado?.nome_completo} />
          <Field label="CPF" value={faturado?.cpf} mono />
        </div>
      </div>

      <div className="fv-card">
        <div className="fv-card-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Dados da NF
        </div>
        <div className="fv-fields fv-row">
          <Field label="Número" value={numero_nota_fiscal} mono />
          <Field label="Emissão" value={fmtDate(data_emissao)} />
          <Field label="Valor Total" value={fmt(valor_total)} highlight />
        </div>
      </div>

      <div className="fv-card fv-card-full">
        <div className="fv-card-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Produtos / Serviços
        </div>
        <p className="fv-desc">{descricao_produtos || <em className="fv-empty">Não informado</em>}</p>
      </div>

      {parcelas?.length > 0 && (
        <div className="fv-card fv-card-full">
          <div className="fv-card-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Parcelas ({parcelas.length})
          </div>
          <table className="fv-table">
            <thead><tr><th>#</th><th>Vencimento</th><th>Valor</th></tr></thead>
            <tbody>
              {parcelas.map(p => (
                <tr key={p.numero_parcela}>
                  <td>{p.numero_parcela}ª</td>
                  <td>{fmtDate(p.data_vencimento) || '—'}</td>
                  <td className="fv-valor">{fmt(p.valor) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {classificacoes_despesa?.length > 0 && (
        <div className="fv-card fv-card-full">
          <div className="fv-card-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Classificação de Despesa
          </div>
          <div className="fv-tags">
            {classificacoes_despesa.map((c, i) => (
              <span key={i} className="fv-tag">{c.categoria}{c.descricao ? ` — ${c.descricao}` : ''}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AnaliseView ─────────────────────────────────────── */

function AnaliseView({ analise, lancamento }) {
  const { fornecedor, faturado, despesa } = analise;
  return (
    <div className="analise-view">
      {[
        { label: 'Fornecedor', data: fornecedor },
        { label: 'Faturado',   data: faturado },
        { label: 'Despesa',    data: despesa },
      ].map(({ label, data }) => (
        <div key={label} className="analise-bloco">
          <div className="analise-tipo">{label}</div>
          <div className="analise-nome">{data.nome || 'Não informado'}</div>
          {data.documento && <div className="analise-doc">{data.documento}</div>}
          <span className={`analise-status ${data.existe ? 'existe' : 'nao-existe'}`}>
            {data.existe ? `✓ Cadastrado — ID #${data.id}` : '✗ Não cadastrado'}
          </span>
        </div>
      ))}
      {lancamento?.sucesso && (
        <div className="analise-sucesso">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          {lancamento.mensagem} (Movimento #{lancamento.movimento_id})
        </div>
      )}
    </div>
  );
}

/* ── UploadSection ───────────────────────────────────── */

export default function UploadSection() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingLancar, setLoadingLancar] = useState(false);
  const [result, setResult] = useState(null);
  const [lancamentoResult, setLancamentoResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('formatted');

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setFile(f); setResult(null); setLancamentoResult(null); setError(null); }
  };

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setLancamentoResult(null); setError(null); }
  };

  const handleExtract = async () => {
    if (!file || loadingExtract || loadingLancar) return;
    setLoadingExtract(true); setError(null); setResult(null); setLancamentoResult(null);
    try { const d = await extractNotaFiscal(file); setResult(d); setTab('formatted'); }
    catch (e) { setError(e.response?.data?.detail || e.message || 'Erro ao processar.'); }
    finally { setLoadingExtract(false); }
  };

  const handleLancar = async () => {
    if (!file || loadingExtract || loadingLancar) return;
    setLoadingLancar(true); setError(null); setLancamentoResult(null);
    try { const d = await lancarNotaFiscal(file); setLancamentoResult(d); setTab('analise'); }
    catch (e) { setError(e.response?.data?.detail || e.message || 'Erro ao lançar.'); }
    finally { setLoadingLancar(false); }
  };

  const anyLoading = loadingExtract || loadingLancar;

  return (
    <div className="nf-section">
      <div className="g-page-header">
        <h1 className="section-title">Importar Nota Fiscal</h1>
      </div>

      {/* Barra de upload compacta */}
      <div
        className={`nf-upload-bar ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept=".pdf" onChange={handleChange} style={{ display: 'none' }} />

        <div className="nf-file-area" onClick={() => inputRef.current.click()}>
          {file ? (
            <>
              <span className="nf-file-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </span>
              <span className="nf-file-name">{file.name}</span>
              <span className="nf-file-size">{(file.size / 1024).toFixed(1)} KB · PDF</span>
              <span className="nf-file-change">Clique para trocar</span>
            </>
          ) : (
            <>
              <span className="nf-upload-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </span>
              <span className="nf-placeholder">Arraste um PDF aqui ou <strong>clique para selecionar</strong></span>
            </>
          )}
        </div>

        <div className="nf-bar-divider" />

        <div className="nf-actions">
          <button className="nf-btn-secondary" onClick={handleExtract} disabled={!file || anyLoading}>
            {loadingExtract
              ? <><span className="nf-spinner nf-spinner-dark" />Extraindo...</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Apenas Extrair</>
            }
          </button>
          <button className="nf-btn-primary" onClick={handleLancar} disabled={!file || anyLoading}>
            {loadingLancar
              ? <><span className="nf-spinner" />Lançando...</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>Extrair e Lançar</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="nf-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {(result || lancamentoResult) && (
        <div className="nf-result-panel">
          <div className="nf-result-header">
            <div className="nf-tabs">
              {result && <>
                <button className={`nf-tab ${tab === 'formatted' ? 'active' : ''}`} onClick={() => setTab('formatted')}>Dados Extraídos</button>
                <button className={`nf-tab ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>JSON</button>
              </>}
              {lancamentoResult && (
                <button className={`nf-tab ${tab === 'analise' ? 'active' : ''}`} onClick={() => setTab('analise')}>Análise do Lançamento</button>
              )}
            </div>
          </div>
          <div className="nf-result-body">
            {tab === 'formatted' && result && <FormattedView data={result} />}
            {tab === 'json'      && result && <JsonViewer data={result} />}
            {tab === 'analise'   && lancamentoResult && (
              <AnaliseView analise={lancamentoResult.analise} lancamento={lancamentoResult.lancamento} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
