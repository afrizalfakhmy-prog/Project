(function () {
  function normalizeApiBase(url) {
    return String(url || '').replace(/\/+$/, '');
  }

  function detectApiBase() {
    if (window.AIOS_API_BASE) return normalizeApiBase(window.AIOS_API_BASE);

    const stored = localStorage.getItem('aios_api_base');
    if (stored) return normalizeApiBase(stored);

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }

    return normalizeApiBase(window.location.origin + '/api');
  }

  const API_BASE = detectApiBase();
  const TOKEN_KEY = 'aios_api_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function request(path, options) {
    const token = getToken();
    const headers = Object.assign({}, options && options.headers ? options.headers : {});

    if (!(options && options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method: (options && options.method) || 'GET',
      headers,
      body: options && options.body !== undefined ? options.body : undefined
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_e) {
        data = { message: text };
      }
    }
    if (!res.ok) {
      const message = (data && data.message) || `HTTP ${res.status}`;
      throw new Error(message);
    }

    return data;
  }

  async function login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data && data.token) setToken(data.token);
    return data;
  }

  async function me() {
    return request('/auth/me');
  }

  async function listKta() {
    return request('/kta');
  }

  async function createKta(payload) {
    return request('/kta', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateKta(id, payload) {
    return request(`/kta/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteKta(id) {
    return request(`/kta/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listTta() {
    return request('/tta');
  }

  async function createTta(payload) {
    return request('/tta', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateTta(id, payload) {
    return request(`/tta/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteTta(id) {
    return request(`/tta/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listTasklist() {
    return request('/tasklist');
  }

  async function listUsers() {
    return request('/users');
  }

  async function createUser(payload) {
    return request('/users', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateUser(id, payload) {
    return request(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteUser(id) {
    return request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listDepartments() {
    return request('/departments');
  }

  async function createDepartment(payload) {
    return request('/departments', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateDepartment(id, payload) {
    return request(`/departments/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteDepartment(id) {
    return request(`/departments/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listCompanies() {
    return request('/companies');
  }

  async function createCompany(payload) {
    return request('/companies', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateCompany(id, payload) {
    return request(`/companies/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteCompany(id) {
    return request(`/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listPja() {
    return request('/pja');
  }

  async function createPja(payload) {
    return request('/pja', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updatePja(id, payload) {
    return request(`/pja/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deletePja(id) {
    return request(`/pja/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listOhsTalk() {
    return request('/ohs-talk');
  }

  async function createOhsTalk(payload) {
    return request('/ohs-talk', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateOhsTalk(id, payload) {
    return request(`/ohs-talk/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteOhsTalk(id) {
    return request(`/ohs-talk/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function listObservasi() {
    return request('/observasi');
  }

  async function createObservasi(payload) {
    return request('/observasi', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function updateObservasi(id, payload) {
    return request(`/observasi/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async function deleteObservasi(id) {
    return request(`/observasi/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  window.AIOSApi = {
    baseUrl: API_BASE,
    getToken,
    setToken,
    clearToken,
    request,
    login,
    me,
    listKta,
    createKta,
    updateKta,
    deleteKta,
    listTta,
    createTta,
    updateTta,
    deleteTta,
    listTasklist,
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    listDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    listCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    listPja,
    createPja,
    updatePja,
    deletePja,
    listOhsTalk,
    createOhsTalk,
    updateOhsTalk,
    deleteOhsTalk,
    listObservasi,
    createObservasi,
    updateObservasi,
    deleteObservasi
  };
})();
