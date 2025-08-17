import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SideBar from '../../common/adminSidebar';
import '../admin-global.css';
import './tenants.css';
import tenantsAPI from '../../../services/tenantsAPI';

const TenantsManagement = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', password:'', address:'', role:'tenant' });
  const [editForm, setEditForm] = useState({ fullName:'', email:'', phone:'', address:'', isActive:true, role:'tenant' });
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({ currentPage:1, totalPages:1, totalItems:0, itemsPerPage:12 });
  const [filters, setFilters] = useState({ search:'', status:'', role:'tenant' });
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search || undefined,
        role: 'tenant',
        status: filters.status || undefined
      };
      const res = await tenantsAPI.searchTenants(params);
      if (res.success) {
        const list = (res.data?.users || res.data?.items || []).map(u => ({
          id: u._id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          isActive: u.isActive !== false,
          avatar: u.avatar,
          address: u.address
        }));
        setTenants(list);
        const pag = res.data?.pagination || { total: list.length, pages:1 };
        setPagination(p => ({ ...p, totalItems: pag.total, totalPages: pag.pages || 1 }));
      }
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(()=>{ fetchTenants(); }, [fetchTenants]);

  const openCreate = () => { setForm({ fullName:'', email:'', phone:'', password:'', address:'', role:'tenant' }); setErrors({}); setShowCreateModal(true); };
  const closeCreate = () => { setShowCreateModal(false); };
  const openEdit = async (id) => {
    try {
      const res = await tenantsAPI.getTenantById(id);
      if (res.success) {
        const u = res.data;
        setEditingId(id);
        setEditForm({
          fullName: u.fullName || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address?.street || '',
          isActive: u.isActive !== false,
          role: u.role || 'tenant'
        });
        setErrors({});
        setShowEditModal(true);
      }
    } catch(e){ console.error(e); }
  };
  const closeEdit = () => { setShowEditModal(false); setEditingId(null); };

  const validate = () => {
    const err = {};
    if(!form.fullName) err.fullName = t('validation.required');
    if(!form.email) err.email = t('validation.required');
    if(!form.phone) err.phone = t('validation.required');
    if(!form.password) err.password = t('validation.required');
    return err;
  };

  const submitCreate = async () => {
    const err = validate();
    setErrors(err);
    if(Object.keys(err).length) return;
    setSaving(true);
    try {
      const payload = { ...form };
      const res = await tenantsAPI.createTenant(payload);
      if (res.success) {
        closeCreate();
        fetchTenants();
      }
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  };

  const submitEdit = async () => {
    setUpdating(true);
    try {
      const payload = { fullName: editForm.fullName, phone: editForm.phone, address: { street: editForm.address }, isActive: editForm.isActive };
      const res = await tenantsAPI.updateTenant(editingId, payload);
      if (res.success) {
        closeEdit();
        fetchTenants();
      }
    } catch(e){ console.error(e); }
    finally { setUpdating(false); }
  };

  return (
    <div className="tenants-container">
      <SideBar />
      <div className="tenants-content">
        <div className="tenants-header">
          <h1 className="tenants-title">{t('tenants.title')}</h1>
          <button className="add-tenant-btn" onClick={openCreate}><i className="fas fa-user-plus" /> {t('tenants.addNew')}</button>
        </div>

        <div className="tenants-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">{t('common.search')}</label>
              <input className="filter-input" value={filters.search} onChange={e=>{ setFilters(f=>({...f,search:e.target.value})); setPagination(p=>({...p,currentPage:1})); }} placeholder={t('tenants.searchPlaceholder')} />
            </div>
            <div className="filter-group">
              <label className="filter-label">{t('common.filter')}</label>
              <select className="filter-select" value={filters.status} onChange={e=>{ setFilters(f=>({...f,status:e.target.value})); setPagination(p=>({...p,currentPage:1})); }}>
                <option value="">{t('common.all')}</option>
                <option value="active">{t('status.active', { defaultValue:'Active' })}</option>
                <option value="inactive">{t('status.inactive', { defaultValue:'Inactive' })}</option>
              </select>
            </div>
            <div className="filter-group">
              <button className="search-btn" onClick={fetchTenants}><i className="fas fa-search" /> {t('common.search')}</button>
            </div>
            <div className="filter-group">
              <button className="reset-btn" onClick={()=>{ setFilters({ search:'', status:'', role:'tenant' }); setPagination(p=>({...p,currentPage:1})); }}><i className="fas fa-redo" /> {t('common.reset')}</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /> <p>{t('common.loading')}</p></div>
        ) : tenants.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">👥</div>
            <h3 className="empty-text">{t('tenants.noTenants')}</h3>
            <p className="empty-description">{t('tenants.noTenantsDescription')}</p>
          </div>
        ) : (
          <div className="tenants-grid">
            {tenants.map(tn => (
              <div key={tn.id} className="tenant-card">
                <div className="tenant-status {tn.isActive ? '' : 'inactive'}">{tn.isActive ? t('status.active') : t('status.inactive')}</div>
                <div className="tenant-header">
                  {tn.avatar ? (
                    <img src={tn.avatar} alt={tn.fullName} className="tenant-avatar" />
                  ) : (
                    <div className="tenant-avatar">{tn.fullName.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()}</div>
                  )}
                  <div>
                    <h3 className="tenant-name">{tn.fullName}</h3>
                    <div className="tenant-contact">{tn.email}<br />{tn.phone}</div>
                  </div>
                </div>
                <div className="tenant-actions">
                  <button className="action-btn" onClick={()=>openEdit(tn.id)}><i className="fas fa-edit" /> {t('common.edit')}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tenants.length>0 && (
          <div className="pagination">
            <button className="pagination-btn" disabled={pagination.currentPage===1} onClick={()=>setPagination(p=>({...p,currentPage:p.currentPage-1}))}><i className="fas fa-chevron-left" /></button>
            <span className="pagination-info">{t('rooms.pagination.page')} {pagination.currentPage} / {pagination.totalPages} ({pagination.totalItems})</span>
            <button className="pagination-btn" disabled={pagination.currentPage===pagination.totalPages} onClick={()=>setPagination(p=>({...p,currentPage:p.currentPage+1}))}><i className="fas fa-chevron-right" /></button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="room-modal-backdrop">
          <div className="room-modal">
            <div className="room-modal-header">
              <h2 className="room-modal-title">{t('tenants.createTitle')}</h2>
              <button className="room-modal-close" onClick={closeCreate}>×</button>
            </div>
            <div className="room-form-grid">
              <div className="room-form-group">
                <label className="room-form-label">{t('form.fullName')}</label>
                <input className="room-form-input" value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} />
                {errors.fullName && <div className="error-text">{errors.fullName}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">Email</label>
                <input className="room-form-input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('form.phone')}</label>
                <input className="room-form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                {errors.phone && <div className="error-text">{errors.phone}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('auth.password')}</label>
                <input type="password" className="room-form-input" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
                {errors.password && <div className="error-text">{errors.password}</div>}
              </div>
              <div className="room-form-group full">
                <label className="room-form-label">{t('form.address')}</label>
                <textarea className="room-form-textarea" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />
              </div>
            </div>
            <div className="room-modal-footer">
              <button className="btn-secondary" onClick={closeCreate}>{t('common.cancel')}</button>
              <button className="btn-primary" disabled={saving} onClick={submitCreate}>{saving ? t('rooms.form.creating') : t('common.create')}</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="room-modal-backdrop">
          <div className="room-modal">
            <div className="room-modal-header">
              <h2 className="room-modal-title">{t('tenants.editTitle')}</h2>
              <button className="room-modal-close" onClick={closeEdit}>×</button>
            </div>
            <div className="room-form-grid">
              <div className="room-form-group">
                <label className="room-form-label">{t('form.fullName')}</label>
                <input className="room-form-input" value={editForm.fullName} onChange={e=>setEditForm(f=>({...f,fullName:e.target.value}))} />
              </div>
              <div className="room-form-group">
                <label className="room-form-label">Email</label>
                <input className="room-form-input" value={editForm.email} disabled />
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('form.phone')}</label>
                <input className="room-form-input" value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))} />
              </div>
              <div className="room-form-group full">
                <label className="room-form-label">{t('form.address')}</label>
                <textarea className="room-form-textarea" value={editForm.address} onChange={e=>setEditForm(f=>({...f,address:e.target.value}))} />
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('common.status', { defaultValue:'Status' })}</label>
                <select className="room-form-select" value={editForm.isActive ? 'active':'inactive'} onChange={e=>setEditForm(f=>({...f,isActive:e.target.value==='active'}))}>
                  <option value="active">{t('status.active', { defaultValue:'Active' })}</option>
                  <option value="inactive">{t('status.inactive', { defaultValue:'Inactive' })}</option>
                </select>
              </div>
            </div>
            <div className="room-modal-footer">
              <button className="btn-secondary" onClick={closeEdit}>{t('common.cancel')}</button>
              <button className="btn-primary" disabled={updating} onClick={submitEdit}>{updating ? (t('rooms.form.updating')||'Updating...') : t('common.update')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TenantsManagement;
