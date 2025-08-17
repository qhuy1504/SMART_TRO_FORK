import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SideBar from '../../common/adminSidebar';
import '../admin-global.css';
import './contracts.css';
import contractsAPI from '../../../services/contractsAPI';
import roomsAPI from '../../../services/roomsAPI';
import tenantsAPI from '../../../services/tenantsAPI';

const ContractsManagement = () => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ room:'', tenant:'', startDate:'', endDate:'', monthlyRent:'', deposit:'', electricPrice:'', waterPrice:'', servicePrice:'', rules:'', notes:'' });
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({ currentPage:1, totalPages:1, totalItems:0, itemsPerPage:12 });
  const [filters, setFilters] = useState({ status:'', search:'' });
  const [roomOptions, setRoomOptions] = useState([]);
  const [tenantOptions, setTenantOptions] = useState([]);
  const [viewing, setViewing] = useState(null);

  const fetchOptions = useCallback(async () => {
    try {
      const roomsRes = await roomsAPI.getAllRooms({ limit:100 });
      const tenantsRes = await tenantsAPI.searchTenants({ role:'tenant', limit:100 });
      setRoomOptions((roomsRes.data?.rooms || roomsRes.data?.items || []).map(r=>({ id:r._id||r.id, label:r.roomNumber||r.name })));
      setTenantOptions((tenantsRes.data?.users || []).map(u=>({ id:u._id, label:u.fullName })));
    } catch(e){ console.error(e); }
  }, []);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.currentPage, limit: pagination.itemsPerPage, status: filters.status||undefined, search: filters.search||undefined };
      const res = await contractsAPI.searchContracts(params); // expected { success, data:{ items, pagination } }
      if (res.success) {
        const list = (res.data?.items || res.data?.contracts || []).map(c => ({
          id: c._id,
          room: c.room?.roomNumber || c.roomNumber || c.room,
          tenant: c.tenant?.fullName || c.tenantName || c.tenant,
          startDate: c.startDate,
          endDate: c.endDate,
          monthlyRent: c.monthlyRent,
          deposit: c.deposit,
          status: c.status,
          signedDate: c.signedDate,
          notes: c.notes
        }));
        setContracts(list);
        const pag = res.data?.pagination || { total:list.length, pages:1 };
        setPagination(p=>({ ...p, totalItems: pag.total, totalPages: pag.pages||1 }));
      }
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(()=>{ fetchContracts(); }, [fetchContracts]);
  useEffect(()=>{ fetchOptions(); }, [fetchOptions]);

  const openCreate = () => { setForm({ room:'', tenant:'', startDate:'', endDate:'', monthlyRent:'', deposit:'', electricPrice:'', waterPrice:'', servicePrice:'', rules:'', notes:'' }); setErrors({}); setShowCreateModal(true); };
  const closeCreate = () => setShowCreateModal(false);

  const validate = () => {
    const err = {};
    if(!form.room) err.room = t('validation.required');
    if(!form.tenant) err.tenant = t('validation.required');
    if(!form.startDate) err.startDate = t('validation.required');
    if(!form.endDate) err.endDate = t('validation.required');
    if(!form.monthlyRent) err.monthlyRent = t('validation.required');
    if(!form.deposit) err.deposit = t('validation.required');
    return err;
  };

  const submitCreate = async () => {
    const err = validate();
    setErrors(err);
    if(Object.keys(err).length) return;
    setCreating(true);
    try {
      const payload = { ...form };
      const res = await contractsAPI.createContract(payload);
      if (res.success) {
        closeCreate();
        fetchContracts();
      }
    } catch(e){ console.error(e); }
    finally { setCreating(false); }
  };

  return (
    <div className="contracts-container">
      <SideBar />
      <div className="contracts-content">
        <div className="contracts-header">
          <h1 className="contracts-title">{t('contracts.title')}</h1>
          <button className="add-contract-btn" onClick={openCreate}><i className="fas fa-file-contract" /> {t('contracts.addNew')}</button>
        </div>

        <div className="contracts-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">{t('common.search')}</label>
              <input className="filter-input" value={filters.search} onChange={e=>{ setFilters(f=>({...f,search:e.target.value})); setPagination(p=>({...p,currentPage:1})); }} placeholder={t('contracts.searchPlaceholder')} />
            </div>
            <div className="filter-group">
              <label className="filter-label">{t('common.filter')}</label>
              <select className="filter-select" value={filters.status} onChange={e=>{ setFilters(f=>({...f,status:e.target.value})); setPagination(p=>({...p,currentPage:1})); }}>
                <option value="">{t('common.all')}</option>
                <option value="active">{t('contracts.status.active')}</option>
                <option value="expired">{t('contracts.status.expired')}</option>
                <option value="terminated">{t('contracts.status.terminated')}</option>
              </select>
            </div>
            <div className="filter-group">
              <button className="search-btn" onClick={fetchContracts}><i className="fas fa-search" /> {t('common.search')}</button>
            </div>
            <div className="filter-group">
              <button className="reset-btn" onClick={()=>{ setFilters({ status:'', search:'' }); setPagination(p=>({...p,currentPage:1})); }}><i className="fas fa-redo" /> {t('common.reset')}</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /> <p>{t('common.loading')}</p></div>
        ) : contracts.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">📄</div>
            <h3 className="empty-text">{t('contracts.empty')}</h3>
            <p className="empty-description">{t('contracts.emptyDescription')}</p>
          </div>
        ) : (
          <div className="contracts-grid">
            {contracts.map(c => (
              <div key={c.id} className="contract-card">
                <div className={`contract-status ${c.status}`}>{t(`contracts.status.${c.status}`, { defaultValue:c.status })}</div>
                <h3 className="tenant-name">{c.room} • {c.tenant}</h3>
                <div className="contract-meta">{t('contracts.startDate')}: {new Date(c.startDate).toLocaleDateString()}<br />{t('contracts.endDate')}: {new Date(c.endDate).toLocaleDateString()}</div>
                <div className="contract-amount">{c.monthlyRent?.toLocaleString()} VND / {t('rooms.month')}</div>
                <div className="contract-meta">{t('contracts.deposit')}: {c.deposit?.toLocaleString()} VND</div>
                <div className="contract-actions">
                  <button className="action-btn" onClick={()=>setViewing(c)}><i className="fas fa-eye" /> {t('common.view')}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {contracts.length>0 && (
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
              <h2 className="room-modal-title">{t('contracts.createTitle')}</h2>
              <button className="room-modal-close" onClick={closeCreate}>×</button>
            </div>
            <div className="room-form-grid">
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.room')}</label>
                <select className="room-form-input" value={form.room} onChange={e=>setForm(f=>({...f,room:e.target.value}))}>
                  <option value="">--</option>
                  {roomOptions.map(r=> <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {errors.room && <div className="error-text">{errors.room}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.tenant')}</label>
                <select className="room-form-input" value={form.tenant} onChange={e=>setForm(f=>({...f,tenant:e.target.value}))}>
                  <option value="">--</option>
                  {tenantOptions.map(r=> <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {errors.tenant && <div className="error-text">{errors.tenant}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.startDate')}</label>
                <input type="date" className="room-form-input" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} />
                {errors.startDate && <div className="error-text">{errors.startDate}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.endDate')}</label>
                <input type="date" className="room-form-input" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} />
                {errors.endDate && <div className="error-text">{errors.endDate}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.monthlyRent')}</label>
                <input className="room-form-input" value={form.monthlyRent} onChange={e=>setForm(f=>({...f,monthlyRent:e.target.value}))} />
                {errors.monthlyRent && <div className="error-text">{errors.monthlyRent}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.deposit')}</label>
                <input className="room-form-input" value={form.deposit} onChange={e=>setForm(f=>({...f,deposit:e.target.value}))} />
                {errors.deposit && <div className="error-text">{errors.deposit}</div>}
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.electricPrice')}</label>
                <input className="room-form-input" value={form.electricPrice} onChange={e=>setForm(f=>({...f,electricPrice:e.target.value}))} />
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.waterPrice')}</label>
                <input className="room-form-input" value={form.waterPrice} onChange={e=>setForm(f=>({...f,waterPrice:e.target.value}))} />
              </div>
              <div className="room-form-group">
                <label className="room-form-label">{t('contracts.servicePrice')}</label>
                <input className="room-form-input" value={form.servicePrice} onChange={e=>setForm(f=>({...f,servicePrice:e.target.value}))} />
              </div>
              <div className="room-form-group full">
                <label className="room-form-label">{t('contracts.rules')}</label>
                <textarea className="room-form-textarea" value={form.rules} onChange={e=>setForm(f=>({...f,rules:e.target.value}))} />
              </div>
              <div className="room-form-group full">
                <label className="room-form-label">{t('contracts.notes')}</label>
                <textarea className="room-form-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>
            </div>
            <div className="room-modal-footer">
              <button className="btn-secondary" onClick={closeCreate}>{t('common.cancel')}</button>
              <button className="btn-primary" disabled={creating} onClick={submitCreate}>{creating ? t('contracts.creating') : t('common.create')}</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="room-modal-backdrop" onClick={()=>setViewing(null)}>
          <div className="room-modal" onClick={e=>e.stopPropagation()}>
            <div className="room-modal-header">
              <h2 className="room-modal-title">{t('contracts.detailTitle')}</h2>
              <button className="room-modal-close" onClick={()=>setViewing(null)}>×</button>
            </div>
            <div className="room-view-grid">
              <p><strong>{t('contracts.room')}:</strong> {viewing.room}</p>
              <p><strong>{t('contracts.tenant')}:</strong> {viewing.tenant}</p>
              <p><strong>{t('contracts.startDate')}:</strong> {new Date(viewing.startDate).toLocaleDateString()}</p>
              <p><strong>{t('contracts.endDate')}:</strong> {new Date(viewing.endDate).toLocaleDateString()}</p>
              <p><strong>{t('contracts.monthlyRent')}:</strong> {viewing.monthlyRent?.toLocaleString()} VND</p>
              <p><strong>{t('contracts.deposit')}:</strong> {viewing.deposit?.toLocaleString()} VND</p>
              <p><strong>{t('contracts.status.label')}:</strong> {t(`contracts.status.${viewing.status}`, { defaultValue:viewing.status })}</p>
              {viewing.notes && <p><strong>{t('contracts.notes')}:</strong> {viewing.notes}</p>}
            </div>
            <div className="room-modal-footer">
              <button className="btn-secondary" onClick={()=>setViewing(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsManagement;
