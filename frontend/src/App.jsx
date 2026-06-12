import { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import GestaoSection from './components/GestaoSection';
import ConsultaSection from './components/ConsultaSection';
import './index.css';
import './App.css';

const SECOES = [
  { id: 'upload',       icon: 'upload',       label: 'Importar NF',            grupo: 'Nota Fiscal' },
  { id: 'fornecedores', icon: 'building',     label: 'Fornecedores / Clientes', grupo: 'Cadastros' },
  { id: 'faturados',    icon: 'user',         label: 'Faturados',               grupo: 'Cadastros' },
  { id: 'despesas',     icon: 'trending-down',label: 'Tipos de Despesa',        grupo: 'Classificações' },
  { id: 'receitas',     icon: 'trending-up',  label: 'Tipos de Receita',        grupo: 'Classificações' },
  { id: 'apagar',       icon: 'credit-card',  label: 'Contas a Pagar',          grupo: 'Movimentos' },
  { id: 'areceber',     icon: 'wallet',       label: 'Contas a Receber',        grupo: 'Movimentos' },
  { id: 'parcelas',     icon: 'calendar',     label: 'Parcelas',                grupo: 'Movimentos' },
  { id: 'consulta',     icon: 'search',       label: 'Consulta IA (RAG)',       grupo: 'Inteligência' },
];

export default function App() {
  const [secao, setSecao] = useState('upload');
  const [collapsed, setCollapsed] = useState(false);

  const itemAtual = SECOES.find(s => s.id === secao);

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        secoes={SECOES}
        secaoAtiva={secao}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onNavegar={setSecao}
      />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              <span className="breadcrumb-group">{itemAtual?.grupo}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="breadcrumb-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span className="breadcrumb-current">{itemAtual?.label}</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-badge">UniRV — Leitor de Nota Fiscal</div>
          </div>
        </header>

        <main className="content-area">
          {secao === 'upload' && <UploadSection />}
          {secao === 'consulta' && <ConsultaSection />}
          {secao !== 'upload' && secao !== 'consulta' && <GestaoSection secao={secao} />}
        </main>
      </div>
    </div>
  );
}
