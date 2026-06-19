import { useState } from 'react';
import { login as loginApi, parsearErroAPI } from '../services/api';
import './LoginSection.css';

export default function LoginSection({ onLogin }) {
  const [loginValue, setLoginValue] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginValue.trim() || !senha) {
      setErro('Informe usuário e senha.');
      return;
    }
    setErro('');
    setLoading(true);
    try {
      const resp = await loginApi(loginValue.trim(), senha);
      if (!resp?.access_token || !resp?.usuario) {
        throw new Error('Resposta inválida do servidor.');
      }
      localStorage.setItem('nf_token', resp.access_token);
      localStorage.setItem('nf_usuario', JSON.stringify(resp.usuario));
      onLogin(resp.usuario);
    } catch (err) {
      setErro(parsearErroAPI(err) || 'Falha ao autenticar.');
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <div className="login-brand-name">LeitorNF</div>
            <div className="login-brand-sub">Sistema Financeiro</div>
          </div>
        </div>

        <h1 className="login-title">Acessar o sistema</h1>
        <p className="login-subtitle">Informe suas credenciais para continuar.</p>

        {erro && <div className="login-error">{erro}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-user">Usuário</label>
            <input
              id="login-user"
              type="text"
              autoComplete="username"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="seu usuário ou e-mail"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-senha">Senha</label>
            <input
              id="login-senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">UniRV © 2026 — Prática de Engenharia de Software</div>
      </div>
    </div>
  );
}
