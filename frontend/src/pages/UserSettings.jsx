import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { toast } from '../services/toast';
import { User, Lock, Mail, Shield, Settings } from 'lucide-react';

export default function UserSettings() {
  const { user, fetchMyInfo } = useAuth();
  const { t, language } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      const roleNames = user.roles ? user.roles.map(r => r.name.replace('ROLE_', '')).join(', ') : '';
      setRoles(roleNames || 'USER');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileLoading(true);

    try {
      await api.put(`/users/${user.id}`, { name });
      await fetchMyInfo();
      toast.success(t('settings.updateSuccess') || 'Cập nhật tài khoản thành công!');
    } catch (err) {
      toast.error(err.message || t('settings.updateFailed') || 'Cập nhật tài khoản thất bại.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordMismatch') || 'Mật khẩu mới không khớp!');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put(`/users/${user.id}`, { password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.updateSuccess') || 'Đổi mật khẩu thành công!');
    } catch (err) {
      toast.error(err.message || t('settings.updateFailed') || 'Đổi mật khẩu thất bại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          {t('settings.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {t('settings.desc')}
        </p>
      </div>

      {/* Settings Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Profile Info Form */}
        <div className="card hover-interactive" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {t('settings.profileTitle')}
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('settings.fullName')}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('settings.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{ paddingLeft: '38px', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('settings.role')}
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  value={roles}
                  disabled
                  style={{ paddingLeft: '38px', cursor: 'not-allowed', textTransform: 'uppercase' }}
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={profileLoading} style={{ marginTop: '4px', justifyContent: 'center' }}>
              {profileLoading ? t('settings.updating') : t('settings.saveChanges')}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card hover-interactive" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Lock size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {t('settings.passwordTitle')}
            </h3>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('settings.newPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('settings.confirmPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={passwordLoading} style={{ marginTop: '4px', justifyContent: 'center' }}>
              {passwordLoading ? t('settings.updating') : t('settings.saveChanges')}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
