import './Sidebar.css';

const ICONS = {
  'search': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  'upload': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  'building': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  'user': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'trending-down': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  'trending-up': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  'credit-card': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  'wallet': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  'calendar': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  'contas': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18"/>
      <path d="M5 21V10l7-5 7 5v11"/>
      <line x1="9" y1="21" x2="9" y2="13"/>
      <line x1="15" y1="21" x2="15" y2="13"/>
      <line x1="12" y1="21" x2="12" y2="13"/>
    </svg>
  ),
  'logout': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

function papelLabel(papel) {
  if (!papel) return '';
  const p = String(papel).toUpperCase();
  if (p === 'ADMIN') return 'Administrador';
  if (p === 'OPERADOR') return 'Operador';
  if (p === 'VIEWER' || p === 'LEITOR') return 'Leitor';
  return papel;
}

function papelVariant(papel) {
  const p = String(papel || '').toUpperCase();
  if (p === 'ADMIN') return 'pill-purple';
  if (p === 'OPERADOR') return 'pill-blue';
  return 'pill-green';
}

export default function Sidebar({ secoes, secaoAtiva, collapsed, onToggle, onNavegar, usuario, onLogout }) {
  const grupos = [...new Set(secoes.map(s => s.grupo))];
  const inicial = (usuario?.nome || usuario?.login || '?').trim().charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div className="sidebar-brand-name">LeitorNF</div>
              <div className="sidebar-brand-sub">Sistema Financeiro</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="sidebar-brand-icon-only">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expandir' : 'Recolher'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed
              ? <polyline points="9 18 15 12 9 6"/>
              : <polyline points="15 18 9 12 15 6"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {grupos.map(grupo => (
          <div key={grupo} className="nav-grupo">
            {!collapsed && <div className="nav-grupo-label">{grupo}</div>}
            {collapsed && <div className="nav-grupo-divider" />}
            {secoes.filter(s => s.grupo === grupo).map(item => (
              <button
                key={item.id}
                className={`nav-item ${secaoAtiva === item.id ? 'nav-item-ativo' : ''}`}
                onClick={() => onNavegar(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{ICONS[item.icon]}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {!collapsed && secaoAtiva === item.id && <span className="nav-active-dot" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User area */}
      {usuario && (
        <div className="sidebar-user">
          {collapsed ? (
            <div className="sidebar-user-collapsed">
              <div className="sidebar-user-avatar" title={usuario.nome || usuario.login}>{inicial}</div>
              <button
                className="sidebar-user-logout-mini"
                onClick={onLogout}
                title="Sair"
              >
                {ICONS['logout']}
              </button>
            </div>
          ) : (
            <>
              <div className="sidebar-user-row">
                <div className="sidebar-user-avatar">{inicial}</div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name" title={usuario.nome || usuario.login}>
                    {usuario.nome || usuario.login}
                  </div>
                  {usuario.papel && (
                    <span className={`sidebar-user-pill ${papelVariant(usuario.papel)}`}>
                      {papelLabel(usuario.papel)}
                    </span>
                  )}
                </div>
              </div>
              <button className="sidebar-user-logout" onClick={onLogout}>
                {ICONS['logout']}
                <span>Sair</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && <div className="sidebar-footer-text">UniRV © 2026</div>}
      </div>
    </aside>
  );
}
