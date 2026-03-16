import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://data-management-platform.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export const getConfig = () => api.get('/api/config');

export const uploadDataset = (file, sheetName, sessionId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) formData.append('sheet_name', sheetName);
  formData.append('session_id', sessionId || 'default');
  return api.post('/api/dq/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const runDQAssessment = (payload) =>
  api.post('/api/dq/run', payload);

export const downloadDQReport = (sessionId) =>
  `${API_BASE}/api/dq/download-report?session_id=${sessionId || 'default'}`;

export const getMaturityQuestions = (dims, objects) =>
  api.post('/api/maturity/questions', { dims, objects });

export const submitMaturity = (payload) =>
  api.post('/api/maturity/submit', payload);

export const downloadMaturityExcel = (sessionId) =>
  `${API_BASE}/api/maturity/download-excel?session_id=${sessionId || 'default'}`;

export const downloadMaturityPDF = (sessionId) =>
  `${API_BASE}/api/maturity/download-pdf?session_id=${sessionId || 'default'}`;

export default api;
