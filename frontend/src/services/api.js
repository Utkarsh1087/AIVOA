const API_BASE = '/api';

export const api = {
  async analyzeText(inputText, source = 'Text Prompt') {
    const res = await fetch(`${API_BASE}/complaints/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_text: inputText, source })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to analyze text' }));
      throw new Error(err.detail || 'Analysis request failed');
    }
    return await res.json();
  },

  async uploadFile(file, sourceType = 'File Upload') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    const res = await fetch(`${API_BASE}/complaints/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload file' }));
      throw new Error(err.detail || 'File processing request failed');
    }
    return await res.json();
  },

  async saveComplaint(payload) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save complaint' }));
      throw new Error(err.detail || 'Save complaint failed');
    }
    return await res.json();
  },

  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.riskLevel) query.append('risk_level', params.riskLevel);
    if (params.statusFilter) query.append('status_filter', params.statusFilter);

    const url = `${API_BASE}/complaints?${query.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch complaints history');
    return await res.json();
  },

  async getComplaintDetail(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    if (!res.ok) throw new Error('Failed to fetch complaint detail');
    return await res.json();
  },

  async reAssessRisk(id, formData) {
    const res = await fetch(`${API_BASE}/complaints/${id}/risk-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) throw new Error('Risk re-assessment failed');
    return await res.json();
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/complaints/stats/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return await res.json();
  },

  async assistantChat(message, context = {}) {
    const res = await fetch(`${API_BASE}/complaints/assistant-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
      throw new Error(err.detail || 'Chat request failed');
    }
    return await res.json();
  }
};
