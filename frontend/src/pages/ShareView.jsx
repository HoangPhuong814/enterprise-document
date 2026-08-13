import React, { useState, useEffect } from 'react';
import { Shield, Download, Lock, AlertCircle, CheckCircle, Loader, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ShareView({ token }) {
  const { language, setLanguage, t } = useLanguage();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  // States for preview in public share
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Helper to extract original filename from S3 presigned URL
  const getOriginalFileNameFromUrl = (url) => {
    try {
      const cleanUrl = url.split('?')[0];
      const key = cleanUrl.split('/').pop();
      const parts = key.split('_');
      if (parts.length > 1) {
        return decodeURIComponent(parts.slice(1).join('_'));
      }
      return decodeURIComponent(key);
    } catch (e) {
      return 'Shared Document';
    }
  };

  const fileName = successUrl ? getOriginalFileNameFromUrl(successUrl) : '';
  const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';

  // Handle preview logic
  const handlePreviewClick = async () => {
    setShowPreview(!showPreview);
    if (!showPreview && ['txt', 'csv', 'json', 'js', 'html', 'css', 'md', 'log'].includes(ext) && !previewContent) {
      setPreviewLoading(true);
      try {
        const textRes = await fetch(successUrl);
        if (textRes.ok) {
          const text = await textRes.text();
          setPreviewContent(text);
        } else {
          setPreviewContent(t('dashboard.previewFailed'));
        }
      } catch (err) {
        setPreviewContent(t('dashboard.previewFailed'));
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  // Hàm thực hiện tải file
  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // POST lên API công khai của backend: /shares/{token}/download
      const response = await fetch(`http://localhost:8080/shares/${token}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passcode: passcode || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('shareView.accessDenied'));
      }

      const s3Url = data.result;
      setSuccessUrl(s3Url);
      
      // Tự động tải file xuống
      const link = document.createElement('a');
      link.href = s3Url;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.message || t('shareView.downloadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Tự động thử download lần đầu (nếu file không cài mật khẩu)
  useEffect(() => {
    handleDownload();
  }, [token]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at top, #111218 0%, #090a0c 100%)'
    }}>
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: showPreview ? '800px' : '440px', 
          textAlign: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
      >
        {/* Tiny Language Toggle at the top right of the card */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              border: 'none',
              background: language === 'en' ? 'var(--accent)' : 'transparent',
              color: language === 'en' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '10px'
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('vi')}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              border: 'none',
              background: language === 'vi' ? 'var(--accent)' : 'transparent',
              color: language === 'vi' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '10px'
            }}
          >
            VI
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
          <Shield size={28} color="#5e6ad2" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.5px' }}>{t('shareView.title')}</h1>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            marginBottom: '16px'
          }}>
            <Download size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 500 }}>{t('shareView.downloadTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
            {t('shareView.passcodeHelp')}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: 'var(--danger-light)',
            border: '1px solid var(--danger)',
            borderRadius: '8px',
            color: 'var(--danger)',
            fontSize: '13px',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {successUrl && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: '8px',
            color: 'var(--success)',
            fontSize: '13px',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <div>{t('dashboard.autoDownloadSuccess') || t('shareView.autoDownloadSuccess')}</div>
          </div>
        )}

        {/* Form nhập Passcode (chỉ hiển thị nếu chưa có successUrl) */}
        {!successUrl && (
          <form onSubmit={handleDownload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left' }}>
                {t('shareView.passcodeRequired')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  placeholder={t('shareView.passcodePlaceholder')}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? (
                <>
                  <Loader className="animate-spin" size={16} style={{ marginRight: '6px' }} />
                  {t('shareView.verifying')}
                </>
              ) : (
                t('shareView.downloadBtn')
              )}
            </button>
          </form>
        )}

        {/* Action Panel once successUrl is resolved */}
        {successUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href={successUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Download size={16} style={{ marginRight: '6px' }} />
                {t('shareView.downloadBtn')}
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreviewClick}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Eye size={16} style={{ marginRight: '6px' }} />
                {showPreview ? t('shareView.hidePreview') : t('shareView.previewInline')}
              </button>
            </div>

            {showPreview && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'left' }}>
                  📄 <strong>{t('shareView.fileLabel')}</strong> {fileName}
                </p>
                <div className="preview-container" style={{ minHeight: '200px' }}>
                  {previewLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                      <Loader className="animate-spin" size={24} color="var(--accent)" />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('shareView.loadingPreview')}</span>
                    </div>
                  ) : (
                    (() => {
                      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
                        return (
                          <img 
                            src={successUrl} 
                            alt={fileName} 
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
                          />
                        );
                      } else if (ext === 'pdf') {
                        return (
                          <iframe 
                            src={`${successUrl}#toolbar=0`} 
                            title={fileName} 
                            width="100%" 
                            height="400px" 
                            style={{ border: 'none', borderRadius: '4px' }} 
                          />
                        );
                      } else if (['txt', 'csv', 'json', 'js', 'html', 'css', 'md', 'log'].includes(ext)) {
                        return (
                          <pre className="preview-text" style={{ maxHeight: '400px' }}>
                            {previewContent}
                          </pre>
                        );
                      } else {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {t('shareView.previewNotSupported', { ext })}
                          </div>
                        );
                      }
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
