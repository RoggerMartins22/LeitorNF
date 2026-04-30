import { useRef, useState } from 'react';
import './UploadArea.css';

export default function UploadArea({ onFileSelect, selectedFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      className={`upload-area${dragging ? ' dragging' : ''}${selectedFile ? ' has-file' : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        <>
          <div className="file-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="upload-file-info">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            <span className="file-change">Clique para trocar o arquivo</span>
          </div>
        </>
      ) : (
        <>
          <div className="upload-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="upload-text">
            <p className="upload-primary">Arraste um PDF aqui ou clique para selecionar</p>
            <p className="upload-secondary">Apenas arquivos <strong>.pdf</strong> são aceitos</p>
          </div>
        </>
      )}
    </div>
  );
}
