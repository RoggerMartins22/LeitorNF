import { useState } from 'react';
import './JsonViewer.css';

export default function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const colorizeJson = (json) =>
    json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'jn';
        if (/^"/.test(match)) cls = /:$/.test(match) ? 'jk' : 'js';
        else if (/true|false/.test(match)) cls = 'jb';
        else if (/null/.test(match)) cls = 'jnl';
        return `<span class="${cls}">${match}</span>`;
      }
    );

  return (
    <div className="json-viewer">
      <div className="json-toolbar">
        <span className="json-label">JSON</span>
        <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copiar JSON
            </>
          )}
        </button>
      </div>
      <pre
        className="json-pre"
        dangerouslySetInnerHTML={{ __html: colorizeJson(jsonString) }}
      />
    </div>
  );
}
