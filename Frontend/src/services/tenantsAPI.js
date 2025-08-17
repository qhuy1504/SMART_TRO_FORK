import api from './api';

const tenantsAPI = {
  async searchTenants(params) {
    const res = await api.get('/users', { params });
    return res.data; // { success, data: { users, pagination } expected }
  },
  async getTenantById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  async createTenant(payload) {
    const res = await api.post('/users/register', payload);
    return res.data;
  },
  async updateTenant(id, payload) {
    const res = await api.put(`/users/${id}`, payload);
    return res.data;
  },
  async toggleActive(id, active) {
    const res = await api.patch(`/users/${id}/status`, { isActive: active });
    return res.data;
  }
};

export default tenantsAPI;
