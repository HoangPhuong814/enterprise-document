import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../services/toast';
import { useConfirm } from '../context/ConfirmContext';
import { Shield, Key, Plus, Trash2, ShieldAlert, Loader, Info } from 'lucide-react';

export default function RolesPermissions() {
  const { t, language } = useLanguage();
  const { confirm } = useConfirm();

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Role Form
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // New Permission Form
  const [permName, setPermName] = useState('');
  const [permDesc, setPermDesc] = useState('');
  const [permSubmitting, setPermSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions')
      ]);
      setRoles(rolesRes.result || []);
      setPermissions(permsRes.result || []);
    } catch (err) {
      console.error(err);
      toast.error(language === 'en' ? 'Failed to fetch roles & permissions' : 'Không thể tải vai trò và quyền hạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setRoleSubmitting(true);
    try {
      // Normalize role name: must start with ROLE_ (unless already provided)
      let finalName = roleName.trim().toUpperCase();
      if (!finalName.startsWith('ROLE_')) {
        finalName = 'ROLE_' + finalName;
      }

      await api.post('/roles', {
        name: finalName,
        description: roleDesc,
        permissions: selectedPerms
      });

      toast.success(t('rolesPermissions.createRoleSuccess'));
      setRoleName('');
      setRoleDesc('');
      setSelectedPerms([]);
      fetchData();
    } catch (err) {
      toast.error(err.message || t('rolesPermissions.createRoleFailed'));
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    if (!permName.trim()) return;

    setPermSubmitting(true);
    try {
      const finalName = permName.trim().toUpperCase();
      await api.post('/permissions', {
        name: finalName,
        description: permDesc
      });

      toast.success(t('rolesPermissions.createPermSuccess'));
      setPermName('');
      setPermDesc('');
      fetchData();
    } catch (err) {
      toast.error(err.message || t('rolesPermissions.createPermFailed'));
    } finally {
      setPermSubmitting(false);
    }
  };

  const handleDeleteRole = async (id) => {
    const isConfirmed = await confirm({
      title: t('rolesPermissions.confirmDeleteRole'),
      message: language === 'en' ? 'Deletions cannot be undone. Users holding this role might lose access.' : 'Không thể khôi phục thao tác này. Những tài khoản sở hữu vai trò này có thể mất quyền truy cập.',
      confirmText: language === 'en' ? 'Delete' : 'Xóa',
      type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/roles/${id}`);
      toast.success(t('rolesPermissions.deleteRoleSuccess'));
      fetchData();
    } catch (err) {
      toast.error(err.message || t('rolesPermissions.deleteRoleFailed'));
    }
  };

  const handleDeletePermission = async (id) => {
    const isConfirmed = await confirm({
      title: t('rolesPermissions.confirmDeletePerm'),
      message: language === 'en' ? 'Deletions cannot be undone. Active roles bound to this permission will be updated.' : 'Không thể khôi phục thao tác này. Các vai trò đang liên kết với quyền này sẽ bị ảnh hưởng.',
      confirmText: language === 'en' ? 'Delete' : 'Xóa',
      type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/permissions/${id}`);
      toast.success(t('rolesPermissions.deletePermSuccess'));
      fetchData();
    } catch (err) {
      toast.error(err.message || t('rolesPermissions.deletePermFailed'));
    }
  };

  const handlePermToggle = (permName) => {
    if (selectedPerms.includes(permName)) {
      setSelectedPerms(selectedPerms.filter(p => p !== permName));
    } else {
      setSelectedPerms([...selectedPerms, permName]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          {t('rolesPermissions.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {t('rolesPermissions.desc')}
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader className="animate-spin" size={28} color="var(--accent)" />
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Roles Configuration Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Create Role Form */}
            <div className="card hover-interactive animate-slide-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Shield size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  {t('rolesPermissions.newRole')}
                </h3>
              </div>

              <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {t('rolesPermissions.roleName')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('rolesPermissions.roleNamePlaceholder')}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    * {language === 'en' ? 'System prefix ROLE_ will be added automatically' : 'Tiền tố hệ thống ROLE_ sẽ được tự động thêm vào'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {t('rolesPermissions.roleDesc')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('rolesPermissions.roleDescPlaceholder')}
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {t('rolesPermissions.rolePermissions')}
                  </label>
                  
                  {permissions.length === 0 ? (
                    <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {language === 'en' ? 'Create permissions on the right first to bind them.' : 'Vui lòng tạo quyền hạn ở cột bên phải trước để liên kết.'}
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '8px',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      padding: '10px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--border-radius)'
                    }}>
                      {permissions.map((perm) => (
                        <div key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            id={`rolePerm-${perm.name}`}
                            checked={selectedPerms.includes(perm.name)}
                            onChange={() => handlePermToggle(perm.name)}
                            style={{ width: 'auto', cursor: 'pointer' }}
                          />
                          <label htmlFor={`rolePerm-${perm.name}`} style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={perm.description}>
                            {perm.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="btn btn-primary" type="submit" disabled={roleSubmitting} style={{ justifyContent: 'center' }}>
                  <Plus size={16} />
                  {t('rolesPermissions.createRoleBtn')}
                </button>
              </form>
            </div>

            {/* Roles List */}
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                {t('rolesPermissions.availableRoles')}
              </h3>

              {roles.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('rolesPermissions.noRoles')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="hover-interactive"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, paddingRight: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {role.name}
                          </span>
                        </div>
                        {role.description && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {role.description}
                          </span>
                        )}
                        {/* Render associated permissions tags */}
                        {role.permissions && role.permissions.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {role.permissions.map(p => (
                              <span key={p.id} className="badge badge-accent" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Do not allow deletion of default core roles like ADMIN / USER / EMPLOYEE */}
                      {!['ROLE_ADMIN', 'ROLE_USER', 'ROLE_EMPLOYEE', 'ADMIN', 'USER', 'EMPLOYEE'].includes(role.name.toUpperCase()) && (
                        <button
                          className="btn btn-text"
                          onClick={() => handleDeleteRole(role.id)}
                          style={{ padding: '6px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Permissions Configuration Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Create Permission Form */}
            <div className="card hover-interactive animate-slide-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Key size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  {t('rolesPermissions.newPermission')}
                </h3>
              </div>

              <form onSubmit={handleCreatePermission} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {t('rolesPermissions.permissionName')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('rolesPermissions.permissionNamePlaceholder')}
                    value={permName}
                    onChange={(e) => setPermName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {t('rolesPermissions.permissionDesc')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('rolesPermissions.permissionDescPlaceholder')}
                    value={permDesc}
                    onChange={(e) => setPermDesc(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={permSubmitting} style={{ justifyContent: 'center' }}>
                  <Plus size={16} />
                  {t('rolesPermissions.createPermBtn')}
                </button>
              </form>
            </div>

            {/* Permissions List */}
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                {t('rolesPermissions.availablePerms')}
              </h3>

              {permissions.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('rolesPermissions.noPerms')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="hover-interactive"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {perm.name}
                        </span>
                        {perm.description && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {perm.description}
                          </span>
                        )}
                      </div>
                      
                      <button
                        className="btn btn-text"
                        onClick={() => handleDeletePermission(perm.id)}
                        style={{ padding: '6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
