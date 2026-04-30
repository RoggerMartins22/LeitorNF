import { useState } from 'react';
import UploadArea from './components/UploadArea';
import JsonViewer from './components/JsonViewer';
import FormattedView from './components/FormattedView';
import { extractNotaFiscal } from './services/api';
import './App.css';

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('formatted');

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractNotaFiscal(file);
      setResult(data);
      setActiveTab('formatted');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erro ao processar o arquivo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="header-text">
            <h1>Extração de Dados de Nota Fiscal</h1>
            <p>Carregue um PDF de nota fiscal e extraia os dados automaticamente usando IA</p>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="upload-card">
          <div className="upload-card-header">
            <h2 className="upload-card-title">Selecione o arquivo</h2>
            <p className="upload-card-desc">Apenas arquivos PDF são suportados</p>
          </div>

          <UploadArea onFileSelect={setFile} selectedFile={file} />

          <button
            className={`extract-btn${loading ? ' loading' : ''}`}
            onClick={handleExtract}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Processando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Extrair Dados
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="error-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section className="result-section">
            <div className="result-header">
              <h2 className="result-title">Dados Extraídos</h2>
              <div className="tabs">
                <button
                  className={`tab${activeTab === 'formatted' ? ' active' : ''}`}
                  onClick={() => setActiveTab('formatted')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Formatado
                </button>
                <button
                  className={`tab${activeTab === 'json' ? ' active' : ''}`}
                  onClick={() => setActiveTab('json')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16,18 22,12 16,6"/>
                    <polyline points="8,6 2,12 8,18"/>
                  </svg>
                  JSON
                </button>
              </div>
            </div>

            <div className="tab-content">
              {activeTab === 'formatted' ? (
                <FormattedView data={result} />
              ) : (
                <JsonViewer data={result} />
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Extrator de Notas Fiscais</p>
      </footer>
    </div>
  );
}
