import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FolderPlus, Trash2, Tag, Loader } from 'lucide-react';
import { toast } from '../services/toast';
import { useConfirm } from '../context/ConfirmContext';

export default function Category() {
  const { t, language } = useLanguage();
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) return;

    try {
      await api.post('/categories', { name, description });
      setSuccess(t('category.createSuccess'));
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      setError(err.message || t('category.createFailed'));
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: language === 'en' ? 'Delete Category?' : 'Xóa Danh mục?',
      message: t('category.confirmDeleteCat'),
      confirmText: language === 'en' ? 'Delete' : 'Xóa',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success(language === 'en' ? 'Category deleted successfully!' : 'Đã xóa danh mục thành công!');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || t('category.deleteFailed'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>{t('category.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('category.desc')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Create Category Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>{t('category.newCategory')}</h3>
          
          {error && (
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '6px', color: 'var(--success)', fontSize: '13px', marginBottom: '12px' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t('category.categoryName')}</label>
              <input
                type="text"
                placeholder={t('category.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t('category.descriptionLabel')}</label>
              <textarea
                placeholder={t('category.descPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }}>
              <FolderPlus size={16} />
              {t('category.createBtn')}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>{t('category.availableCats')}</h3>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader className="animate-spin" size={24} color="var(--accent)" />
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('category.noCats')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="hover-interactive animate-slide-up"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', color: 'var(--accent)' }}>
                      <Tag size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 500 }}>{cat.name}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {cat.description || t('category.noDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-text"
                    onClick={() => handleDelete(cat.id)}
                    style={{ padding: '8px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
