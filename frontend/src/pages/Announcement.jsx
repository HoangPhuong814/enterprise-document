import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { toast } from '../services/toast';
import { Megaphone, Plus, Edit, Trash2, Loader, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function Announcement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPublished, setAnnPublished] = useState(true);
  const [modalError, setModalError] = useState('');

  const isAdmin = user?.email?.startsWith('admin');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/announcements?page=${page}&size=5`);
      setAnnouncements(response.result?.data || []);
      setTotalPages(response.result?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error(language === 'en' ? 'Failed to fetch announcements.' : 'Lấy danh sách thông báo thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  const openCreateModal = () => {
    setEditingAnn(null);
    setAnnTitle('');
    setAnnContent('');
    setAnnPublished(true);
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (ann) => {
    setEditingAnn(ann);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnPublished(ann.published);
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!annTitle.trim()) {
      setModalError(language === 'en' ? 'Title is required' : 'Vui lòng nhập tiêu đề');
      return;
    }

    const payload = {
      title: annTitle,
      content: annContent,
      published: annPublished,
      authorEmail: user?.email
    };

    try {
      if (editingAnn) {
        await api.put(`/announcements/${editingAnn.id}`, payload);
        toast.success(t('announcements.updateSuccess'));
      } else {
        await api.post('/announcements', payload);
        toast.success(t('announcements.createSuccess'));
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      setModalError(err.message || (editingAnn ? t('announcements.updateFailed') : t('announcements.createFailed')));
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: language === 'en' ? 'Delete Announcement?' : 'Xóa thông báo?',
      message: t('announcements.confirmDelete'),
      confirmText: language === 'en' ? 'Delete' : 'Xóa',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/announcements/${id}`);
      toast.success(t('announcements.deleteSuccess'));
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.message || t('announcements.deleteFailed'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    try {
      return new Date(dateString).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            {t('announcements.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {t('announcements.desc')}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            {t('announcements.newAnnouncement')}
          </button>
        )}
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader className="animate-spin" size={28} color="var(--accent)" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Megaphone size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('announcements.noAnnouncements')}</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--accent-light)', borderRadius: '8px', color: 'var(--accent)' }}>
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{ann.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} />
                        {ann.authorEmail}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} />
                        {formatDate(ann.publishedAt || ann.createdAt)}
                      </span>
                      {isAdmin && (
                        <span className={`badge ${ann.published ? 'badge-accent' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                          {ann.published ? t('announcements.publishedBadge') : t('announcements.draft')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => openEditModal(ann)}
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title={language === 'en' ? 'Edit' : 'Sửa'}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDelete(ann.id)}
                      style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--danger)' }}
                      title={language === 'en' ? 'Delete' : 'Xóa'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Announcement Content */}
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  paddingLeft: '48px',
                }}
              >
                {ann.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
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

      {/* Create / Edit Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.5px', margin: 0 }}>
                {editingAnn ? t('announcements.editAnnouncement') : t('announcements.newAnnouncement')}
              </h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                {t('common.close')}
              </button>
            </div>

            {modalError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={15} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('announcements.announcementTitle')}
                </label>
                <input
                  type="text"
                  placeholder={t('announcements.titlePlaceholder')}
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('announcements.content')}
                </label>
                <textarea
                  placeholder={t('announcements.contentPlaceholder')}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows={6}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="annPublished"
                  checked={annPublished}
                  onChange={(e) => setAnnPublished(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="annPublished" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                  {t('announcements.publishedLabel')}
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
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
