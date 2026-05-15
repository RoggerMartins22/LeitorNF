import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

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

// ── PARCELAS ─────────────────────────────────────────────────────────────
export const getParcelas = () => api.get('/api/gestao/parcelas').then(r => r.data);
