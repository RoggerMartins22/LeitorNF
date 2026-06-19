import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// ── Interceptors ────────────────────────────────────────────────────────
// Attach Authorization: Bearer <token> if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nf_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear credentials and notify the app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('nf_token');
      localStorage.removeItem('nf_usuario');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export function parsearErroAPI(e) {
  const status = e.response?.status;
  const detail = e.response?.data?.detail || '';

  if (status === 429 || detail.includes('RESOURCE_EXHAUSTED')) {
    const retry = detail.match(/retry in (\d+)/i);
    const suffix = retry ? ` Tente novamente em ${retry[1]}s.` : '';
    return `Cota da API Gemini esgotada. Gere uma nova chave em aistudio.google.com/app/apikey ou aguarde o reset diário.${suffix}`;
  }

  if (status === 404 || detail.includes('NOT_FOUND')) {
    if (detail.includes('not found for API version')) {
      return 'Modelo de IA indisponível para esta chave de API. Verifique a configuração.';
    }
  }

  if (!e.response) {
    return 'Sem conexão com o servidor. Verifique se os containers estão rodando.';
  }

  if (status === 400) return detail || 'Requisição inválida.';
  if (status === 422) return detail || 'Arquivo inválido ou dados incorretos.';
  if (status === 500) {
    // Remove o prefixo verbose do FastAPI e o JSON do Gemini
    const clean = detail.replace(/^Erro ao .+?: /, '').replace(/\{.*\}/s, '').trim();
    return clean || 'Erro interno no servidor.';
  }

  return detail || e.message || 'Erro desconhecido.';
}

export const extractNotaFiscal = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
};

export const lancarNotaFiscal = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/lancar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
};

// ── PESSOAS ──────────────────────────────────────────────────────────────
export const getPessoas          = () => api.get('/api/gestao/pessoas').then(r => r.data);
export const criarPessoa         = (data) => api.post('/api/gestao/pessoas', data).then(r => r.data);
export const atualizarPessoa     = (id, data) => api.put(`/api/gestao/pessoas/${id}`, data).then(r => r.data);
export const inativarPessoa      = (id) => api.patch(`/api/gestao/pessoas/${id}/inativar`).then(r => r.data);
export const reativarPessoa      = (id) => api.patch(`/api/gestao/pessoas/${id}/reativar`).then(r => r.data);

// ── CLASSIFICAÇÕES ───────────────────────────────────────────────────────
export const getClassificacoes      = () => api.get('/api/gestao/classificacoes').then(r => r.data);
export const criarClassificacao     = (data) => api.post('/api/gestao/classificacoes', data).then(r => r.data);
export const atualizarClassificacao = (id, data) => api.put(`/api/gestao/classificacoes/${id}`, data).then(r => r.data);
export const inativarClassificacao  = (id) => api.patch(`/api/gestao/classificacoes/${id}/inativar`).then(r => r.data);
export const reativarClassificacao  = (id) => api.patch(`/api/gestao/classificacoes/${id}/reativar`).then(r => r.data);

// ── MOVIMENTOS ───────────────────────────────────────────────────────────
export const getMovimentos      = () => api.get('/api/gestao/movimentos').then(r => r.data);
export const getMovimento       = (id) => api.get(`/api/gestao/movimentos/${id}`).then(r => r.data);
export const criarMovimento     = (data) => api.post('/api/gestao/movimentos', data).then(r => r.data);
export const atualizarMovimento = (id, data) => api.put(`/api/gestao/movimentos/${id}`, data).then(r => r.data);

// Busca filtrada (q por descrição, numero_nf, tipo, ativo, order_by, order_dir)
export const buscarMovimentos = (params = {}) =>
  api.get('/api/gestao/movimentos', { params }).then(r => r.data);
// Lista somente movimentos ativos (ordenados por criado_em DESC)
export const todosMovimentos = () =>
  api.get('/api/gestao/movimentos/todos').then(r => r.data);

// ── PARCELAS ─────────────────────────────────────────────────────────────
export const getParcelas = () => api.get('/api/gestao/parcelas').then(r => r.data);

// ── RAG ──────────────────────────────────────────────────────────────────
export const perguntarRAG = (pergunta, modo) =>
  api.post('/api/rag/perguntar', { pergunta, modo }).then(r => r.data);

export const indexarRAG = () =>
  api.post('/api/rag/indexar').then(r => r.data);

export const statusRAG = () =>
  api.get('/api/rag/status').then(r => r.data);

// ── AUTH ─────────────────────────────────────────────────────────────────
export const login = (loginValue, senha) =>
  api.post('/api/auth/login', { login: loginValue, senha }).then(r => r.data);

export const getMe = () => api.get('/api/auth/me').then(r => r.data);

// ── CONTAS ───────────────────────────────────────────────────────────────
export const buscarContas = (params = {}) =>
  api.get('/api/gestao/contas', { params }).then(r => r.data);
export const todosContas = () =>
  api.get('/api/gestao/contas/todos').then(r => r.data);
export const criarConta = (dados) =>
  api.post('/api/gestao/contas', dados).then(r => r.data);
export const atualizarConta = (id, dados) =>
  api.put(`/api/gestao/contas/${id}`, dados).then(r => r.data);
export const inativarConta = (id) =>
  api.patch(`/api/gestao/contas/${id}/inativar`).then(r => r.data);
export const reativarConta = (id) =>
  api.patch(`/api/gestao/contas/${id}/reativar`).then(r => r.data);

// ── PESSOAS (busca / todos) ──────────────────────────────────────────────
export const buscarPessoas = (params = {}) =>
  api.get('/api/gestao/pessoas', { params }).then(r => r.data);
export const todasPessoas = () =>
  api.get('/api/gestao/pessoas/todos').then(r => r.data);

// ── CLASSIFICAÇÕES (busca / todos) ───────────────────────────────────────
export const buscarClassificacoes = (params = {}) =>
  api.get('/api/gestao/classificacoes', { params }).then(r => r.data);
export const todasClassificacoes = () =>
  api.get('/api/gestao/classificacoes/todos').then(r => r.data);
