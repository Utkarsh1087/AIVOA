let rawUrl = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
  if (!rawUrl.endsWith('/api')) {
    rawUrl = `${rawUrl}/api`;
  }
} else if (!rawUrl.startsWith('/')) {
  rawUrl = '/api';
}
const API_BASE = rawUrl;

async function parseResponse(res, defaultError = 'Request failed') {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText || defaultError}`);
    }
    throw new Error('Invalid JSON response received from API server.');
  }
  if (!res.ok) {
    throw new Error(data?.detail || defaultError);
  }
  return data;
}

export const api = {
  async analyzeText(inputText, source = 'Text Prompt') {
    const res = await fetch(`${API_BASE}/complaints/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_text: inputText, source })
    });
    return await parseResponse(res, 'Analysis request failed');
  },

  async uploadFile(file, sourceType = 'File Upload') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    const res = await fetch(`${API_BASE}/complaints/upload`, {
      method: 'POST',
      body: formData
    });
    return await parseResponse(res, 'File processing request failed');
  },

  async saveComplaint(payload) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await parseResponse(res, 'Save complaint failed');
  },

  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.riskLevel) query.append('risk_level', params.riskLevel);
    if (params.statusFilter) query.append('status_filter', params.statusFilter);

    const url = `${API_BASE}/complaints?${query.toString()}`;
    const res = await fetch(url);
    return await parseResponse(res, 'Failed to fetch complaints history');
  },

  async getComplaintDetail(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    return await parseResponse(res, 'Failed to fetch complaint detail');
  },

  async reAssessRisk(id, formData) {
    const res = await fetch(`${API_BASE}/complaints/${id}/risk-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return await parseResponse(res, 'Risk re-assessment failed');
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/complaints/stats/dashboard`);
    return await parseResponse(res, 'Failed to fetch dashboard metrics');
  },

  async assistantChat(message, context = {}) {
    const res = await fetch(`${API_BASE}/complaints/assistant-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });
    return await parseResponse(res, 'Chat request failed');
  }
};
