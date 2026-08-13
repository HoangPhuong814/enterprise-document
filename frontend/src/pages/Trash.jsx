import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RotateCcw, Trash2, FileText, Loader } from 'lucide-react';
import { toast } from '../services/toast';
import { useConfirm } from '../context/ConfirmContext';

export default function Trash() {
  const { t, language } = useLanguage();
  const { confirm } = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/trash?page=${page}&size=10`);
      setDocuments(response.result.data || []);
      setTotalPages(response.result.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [page]);

  const handleRestore = async (id) => {
    try {
      await api.put(`/documents/${id}/restore`);
      toast.success(t('trash.restoreSuccess'));
      fetchTrash();
    } catch (err) {
      toast.error(err.message || t('trash.restoreFailed'));
    }
  };

  const handlePermanentDelete = async (id) => {
    const isConfirmed = await confirm({
      title: language === 'en' ? 'Delete Permanently?' : 'Xóa vĩnh viễn?',
      message: t('trash.confirmDeleteForever'),
      confirmText: language === 'en' ? 'Delete' : 'Xóa',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/documents/${id}/permanent`);
      toast.success(t('trash.deleteForeverSuccess'));
      fetchTrash();
    } catch (err) {
      toast.error(err.message || t('trash.deleteForeverFailed'));
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>{t('trash.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('trash.desc')}</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader className="animate-spin" size={24} color="var(--accent)" />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('trash.emptyTrash')}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('dashboard.colName')}</th>
                    <th>{t('dashboard.colType')}</th>
                    <th>{t('dashboard.colSize')}</th>
                    <th>{t('dashboard.colUploader')}</th>
                    <th style={{ textAlign: 'right' }}>{t('dashboard.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={18} color="var(--text-muted)" />
                          <span style={{ fontWeight: 500 }}>{doc.fileName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">{doc.fileType?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}</span>
                      </td>
                      <td>{formatSize(doc.fileSize)}</td>
                      <td>{doc.uploader?.fullName || 'System'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleRestore(doc.id)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <RotateCcw size={14} />
                            {t('trash.actionRestore')}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handlePermanentDelete(doc.id)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <Trash2 size={14} />
                            {t('trash.actionDeleteForever')}
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
    </div>
  );
}
