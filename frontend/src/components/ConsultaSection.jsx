import { useState, useEffect, useRef } from 'react';
import { perguntarRAG, indexarRAG, statusRAG, parsearErroAPI } from '../services/api';
import './ConsultaSection.css';

const SUGESTOES = [
  'Qual o valor total gasto com insumos agrícolas?',
  'Quais notas fiscais foram emitidas este ano?',
  'Qual foi a nota de maior valor e do que se trata?',
  'Quais parcelas vencem em junho de 2026?',
  'Liste os fornecedores com mais notas lançadas.',
];

export default function ConsultaSection() {
  const [modo, setModo] = useState('simples');
  const [pergunta, setPergunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [status, setStatus] = useState(null);
  const [indexando, setIndexando] = useState(false);
  const [msgIndexar, setMsgIndexar] = useState(null);
  const textareaRef = useRef(null);
  const resultadoRef = useRef(null);

  useEffect(() => {
    if (modo === 'embeddings') carregarStatus();
  }, [modo]);

  const carregarStatus = async () => {
    try {
      const s = await statusRAG();
      setStatus(s);
    } catch {
      setStatus(null);
    }
  };

  const handleIndexar = async () => {
    setIndexando(true);
    setMsgIndexar(null);
    try {
      const r = await indexarRAG();
      setMsgIndexar({ tipo: 'sucesso', texto: r.mensagem });
      carregarStatus();
    } catch (e) {
      setMsgIndexar({
        tipo: 'erro',
        texto: parsearErroAPI(e),
      });
    } finally {
      setIndexando(false);
    }
  };

  const handlePerguntar = async () => {
    if (!pergunta.trim()) return;
    setLoading(true);
    setErro(null);
    setResultado(null);
    try {
      const r = await perguntarRAG(pergunta.trim(), modo);
      setResultado(r);
      setHistorico(h =>
        [{ pergunta: pergunta.trim(), resultado: r, modo, id: Date.now() }, ...h].slice(0, 10)
      );
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setErro(parsearErroAPI(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePerguntar();
  };

  const handleHistoricoClick = (item) => {
    setPergunta(item.pergunta);
    setResultado(item.resultado);
    setModo(item.modo);
    setErro(null);
  };

  const indexeDesatualizado = status && status.documentos_indexados < status.movimentos_banco;

  return (
    <div className="rag-section">

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="rag-header-card">
        <div className="rag-header-icon">
          <IconBrain />
        </div>
        <div>
          <h2 className="rag-header-title">Consulta IA (RAG)</h2>
          <p className="rag-header-sub">
            Faça perguntas em linguagem natural sobre seus dados financeiros e receba respostas geradas pelo Gemini.
          </p>
        </div>
      </div>

      {/* ── Seletor de modo ─────────────────────────────────────────────── */}
      <div className="rag-mode-bar">
        <div className="rag-mode-toggle">
          <button
            className={`rag-mode-btn ${modo === 'simples' ? 'ativo' : ''}`}
            onClick={() => setModo('simples')}
          >
            <IconSearch size={13} />
            RAG Simples
          </button>
          <button
            className={`rag-mode-btn ${modo === 'embeddings' ? 'ativo' : ''}`}
            onClick={() => setModo('embeddings')}
          >
            <IconVetor size={13} />
            RAG Embeddings
          </button>
          <button
            className={`rag-mode-btn ${modo === 'analitico' ? 'ativo' : ''}`}
            onClick={() => setModo('analitico')}
          >
            <IconChart size={13} />
            RAG Analítico
          </button>
        </div>
        <span className="rag-mode-desc">
          {modo === 'simples'
            ? 'Recuperação por palavras-chave via busca textual no banco'
            : modo === 'analitico'
            ? 'Analisa o banco completo — ideal para "maior valor", totais, rankings e parcelas vencidas'
            : 'Recuperação semântica por similaridade de cosseno entre vetores'}
        </span>
      </div>

      {/* ── Barra de indexação (só no modo embeddings) ───────────────────── */}
      {modo === 'embeddings' && (
        <div className={`rag-indexar-bar ${indexeDesatualizado ? 'desatualizado' : ''}`}>
          <div className="rag-status-info">
            <IconInfo />
            {status ? (
              <span>
                <strong>{status.documentos_indexados}</strong> de{' '}
                <strong>{status.movimentos_banco}</strong> movimento(s) indexado(s)
                {indexeDesatualizado && (
                  <span className="rag-warn-tag"> — índice desatualizado</span>
                )}
              </span>
            ) : (
              <span>Carregando status do índice...</span>
            )}
          </div>
          <button
            className="rag-btn-indexar"
            onClick={handleIndexar}
            disabled={indexando}
          >
            {indexando ? <span className="rag-spinner" /> : <IconRefresh size={13} />}
            {indexando ? 'Indexando…' : 'Indexar base'}
          </button>
          {msgIndexar && (
            <span className={`rag-msg-indexar ${msgIndexar.tipo}`}>
              {msgIndexar.texto}
            </span>
          )}
        </div>
      )}

      {/* ── Área de consulta ────────────────────────────────────────────── */}
      <div className="rag-query-card">
        <label className="rag-query-label">Sua pergunta</label>
        <div className="rag-textarea-wrap">
          <textarea
            ref={textareaRef}
            className="rag-textarea"
            placeholder="Ex: Qual o valor total gasto com manutenção? (Ctrl+Enter para enviar)"
            value={pergunta}
            onChange={e => setPergunta(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
        </div>
        <div className="rag-query-footer">
          <div className="rag-sugestoes">
            <span className="rag-sugestoes-label">Sugestões:</span>
            {SUGESTOES.map((s, i) => (
              <button
                key={i}
                className="rag-sugestao-chip"
                onClick={() => setPergunta(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            className="rag-btn-perguntar"
            onClick={handlePerguntar}
            disabled={loading || !pergunta.trim()}
          >
            {loading ? <span className="rag-spinner branco" /> : <IconSearch size={15} />}
            {loading ? 'Consultando…' : 'Perguntar'}
          </button>
        </div>
      </div>

      {/* ── Erro ────────────────────────────────────────────────────────── */}
      {erro && (
        <div className="rag-erro">
          <IconAlerta />
          {erro}
        </div>
      )}

      {/* ── Resultado ───────────────────────────────────────────────────── */}
      {resultado && (
        <div className="rag-resultado" ref={resultadoRef}>

          {/* Resposta da IA */}
          <div className="rag-resposta-card">
            <div className="rag-resposta-header">
              <IconSparkle />
              <span>Resposta da IA</span>
              <span className={`rag-badge-modo ${resultado.modo}`}>
                {resultado.modo === 'simples' ? 'RAG Simples' : resultado.modo === 'analitico' ? 'RAG Analítico' : 'RAG Embeddings'}
              </span>
            </div>
            <div className="rag-resposta-texto">{resultado.resposta}</div>
          </div>

          {/* Fontes */}
          {resultado.fontes && resultado.fontes.length > 0 && (
            <div className="rag-fontes-card">
              <div className="rag-fontes-header">
                <IconFile />
                <span>Fontes utilizadas ({resultado.fontes.length})</span>
              </div>
              <div className="rag-fontes-lista">
                {resultado.fontes.map((f, i) => (
                  <div key={i} className="rag-fonte-item">
                    <div className="rag-fonte-numero">{i + 1}</div>
                    <div className="rag-fonte-info">
                      <div className="rag-fonte-nf">
                        NF <strong>{f.numero_nf || '—'}</strong>
                        {f.data_nf && (
                          <span className="rag-fonte-data"> · {formatarData(f.data_nf)}</span>
                        )}
                      </div>
                      <div className="rag-fonte-meta">
                        {f.fornecedor && <span className="rag-chip-fornecedor">{f.fornecedor}</span>}
                        {f.valor != null && (
                          <span className="rag-chip-valor">
                            {Number(f.valor).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        )}
                      </div>
                      {f.descricao && (
                        <div className="rag-fonte-desc">{f.descricao}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Histórico da sessão ─────────────────────────────────────────── */}
      {historico.length > 0 && (
        <div className="rag-historico-card">
          <div className="rag-historico-header">
            <IconClock />
            <span>Histórico da sessão</span>
            <span className="rag-count">{historico.length} consulta(s)</span>
          </div>
          <div className="rag-historico-lista">
            {historico.map((h) => (
              <button
                key={h.id}
                className="rag-historico-item"
                onClick={() => handleHistoricoClick(h)}
              >
                <span className="rag-historico-pergunta">{h.pergunta}</span>
                <span className={`rag-badge-modo mini ${h.modo}`}>
                  {h.modo === 'simples' ? 'Simples' : h.modo === 'analitico' ? 'Analítico' : 'Embeddings'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(data) {
  if (!data) return '—';
  try {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  } catch {
    return data;
  }
}

// ── Ícones inline ────────────────────────────────────────────────────────────

function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconVetor({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="19" cy="19" r="2" />
      <line x1="7" y1="12" x2="17" y2="6" />
      <line x1="7" y1="12" x2="17" y2="18" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.88A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.88A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M19.07 19.07l.7.7M3 12h1M20 12h1M4.22 19.78l.7-.7M19.07 4.93l.7-.7" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconAlerta() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconRefresh({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconChart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
