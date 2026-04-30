import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export const extractNotaFiscal = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
