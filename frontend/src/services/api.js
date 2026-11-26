const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const data = await res.json();
      if (data.detail) {
        errorDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      } else if (data.errors) {
        errorDetail = data.errors.join(', ');
      }
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(10000) });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Backend health check error:', err);
      return { status: 'offline', error: err.message };
    }
  },

  async getMeta() {
    const res = await fetch(`${API_BASE}/meta`);
    return await handleResponse(res);
  },

  async predict(payload, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  async compareModels(payload, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/predict/compare`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  async getSampleReadings(limit = 300) {
    const res = await fetch(`${API_BASE}/sample-readings?limit=${limit}`);
    return await handleResponse(res);
  }
};
