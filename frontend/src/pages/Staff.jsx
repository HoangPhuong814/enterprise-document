import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import { toast } from '../services/toast';
import { Users, UserPlus, Edit, Trash2, Loader, User, Mail, ShieldAlert, CheckCircle, AlertCircle, Key } from 'lucide-react';

export default function Staff() {
  const { t, language } = useLanguage();
  const { confirm } = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allRoles, setAllRoles] = useState([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]); // Array of role names, e.g. ['USER']

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users?page=${page}&size=10`);
      setUsers(response.result?.data || []);
      setTotalPages(response.result?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error(language === 'en' ? 'Failed to fetch users list' : 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      const response = await api.get('/roles');
      setAllRoles(response.result || []);
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(language === 'en' ? 'All fields are required' : 'Vui lòng điền đầy đủ các thông tin');
      return;
    }

    try {
      await api.post('/users/create', { email, name, password });
      toast.success(t('staff.createSuccess'));
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || t('staff.createFailed'));
    }
  };

  const openEditModal = (userItem) => {
    setEditingUser(userItem);
    setName(userItem.name || '');
    setPassword('');
    const rolesList = userItem.roles?.map(r => r.name) || [];
    setSelectedRoles(rolesList);
    setError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(language === 'en' ? 'Name is required' : 'Họ và tên không được để trống');
      return;
    }

    if (selectedRoles.length === 0) {
      setError(language === 'en' ? 'Please select at least one role' : 'Vui lòng chọn ít nhất một vai trò');
      return;
    }

    const payload = {
      name,
      roles: selectedRoles
    };

    if (password.trim()) {
      payload.password = password;
    }

    try {
      await api.put(`/users/${editingUser.id}`, payload);
      toast.success(t('staff.updateSuccess'));
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || t('staff.updateFailed'));
    }
  };

  const handleDelete = async (userItem) => {
    const isConfirmed = await confirm({
      title: language === 'en' ? 'Delete Staff Member?' : 'Xóa nhân viên?',
      message: t('staff.confirmDelete'),
      confirmText: language === 'en' ? 'Delete' : 'Xóa',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/users/${userItem.id}`);
      toast.success(t('staff.deleteSuccess'));
      fetchUsers();
    } catch (err) {
      toast.error(err.message || t('staff.deleteFailed'));
    }
  };

  const handleRoleToggle = (roleName) => {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleName));
    } else {
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            {t('staff.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {t('staff.desc')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={16} />
          {t('staff.newStaff')}
        </button>
      </div>

      {/* Users List Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader className="animate-spin" size={28} color="var(--accent)" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            {language === 'en' ? 'No staff accounts found.' : 'Chưa có tài khoản nhân viên nào.'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('staff.colName')}</th>
                    <th>{t('staff.colEmail')}</th>
                    <th>{t('staff.colRoles')}</th>
                    <th style={{ textAlign: 'right' }}>{t('staff.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            flexShrink: 0
                          }}>
                            <User size={15} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{userItem.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{userItem.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {userItem.roles?.map((role) => (
                            <span
                              key={role.id}
                              className={`badge ${role.name === 'ADMIN' ? 'badge-accent' : 'badge-gray'}`}
                              style={{ fontSize: '11px', fontWeight: 500 }}
                            >
                              {role.name}
                            </span>
                          )) || <span className="badge badge-gray">USER</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEditModal(userItem)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <Edit size={13} />
                            {language === 'en' ? 'Edit' : 'Sửa'}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(userItem)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <Trash2 size={13} />
                            {language === 'en' ? 'Delete' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {t('trash.prev')}
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {t('trash.pageOf', { page, totalPages })}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {t('trash.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Staff Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.5px', margin: 0 }}>
                {t('staff.newStaff')}
              </h3>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ padding: '4px 10px', fontSize: '12px' }}>
                {t('common.close')}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('staff.colName')}
                </label>
                <input
                  type="text"
                  placeholder={t('staff.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('staff.colEmail')}
                </label>
                <input
                  type="email"
                  placeholder={t('staff.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  placeholder={t('staff.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.5px', margin: 0 }}>
                {t('staff.editStaff')}
              </h3>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ padding: '4px 10px', fontSize: '12px' }}>
                {t('common.close')}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('staff.colName')}
                </label>
                <input
                  type="text"
                  placeholder={t('staff.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('auth.password')} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('staff.passwordHelp')}</span>
                </label>
                <input
                  type="password"
                  placeholder={t('staff.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {t('staff.colRoles')}
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  maxHeight: '140px',
                  overflowY: 'auto'
                }}>
                  {allRoles.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {language === 'en' ? 'No roles available.' : 'Không có vai trò khả dụng.'}
                    </div>
                  ) : (
                    allRoles.map((role) => (
                      <div key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id={`staffRole-${role.name}`}
                          checked={selectedRoles.includes(role.name)}
                          onChange={() => handleRoleToggle(role.name)}
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        <label htmlFor={`staffRole-${role.name}`} style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }} title={role.description}>
                          {role.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
