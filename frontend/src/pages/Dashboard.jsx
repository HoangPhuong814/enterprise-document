import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Archive,
  File,
  Folder,
  Upload,
  Download,
  Trash2,
  Share2,
  Eye,
  Search,
  Filter,
  Clipboard,
  Check,
  Calendar,
  Lock,
  ArrowUpDown,
  Loader,
  Database,
  Files,
  Edit,
} from 'lucide-react';
import { toast } from '../services/toast';
import { useConfirm } from '../context/ConfirmContext';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { confirm } = useConfirm();
  const { user } = useAuth();

  const [viewTab, setViewTab] = useState('all'); // 'all' or 'mine'
  const [departments, setDepartments] = useState([]);
  const [uploadAccessRole, setUploadAccessRole] = useState('PUBLIC');

  const [editingDoc, setEditingDoc] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editAccessRole, setEditAccessRole] = useState('PUBLIC');

  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const [file, setFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [sharingDoc, setSharingDoc] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [shareResult, setShareResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeShares, setActiveShares] = useState([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const [totalElements, setTotalElements] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const getFileIcon = (fileName) => {
    if (!fileName) return <File size={18} color="var(--text-muted)" />;
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText size={18} color="#e05c5c" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
        return <FileImage size={18} color="#10b981" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet size={18} color="#10b981" />;
      case 'doc':
      case 'docx':
        return <FileText size={18} color="#5e6ad2" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive size={18} color="#eab308" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
      case 'java':
      case 'py':
        return <FileCode size={18} color="#f59e0b" />;
      default:
        return <File size={18} color="var(--text-muted)" />;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handlePreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewContent('');
    try {
      const response = await api.get(`/documents/${doc.id}/download`);
      const presignedUrl = response.result;
      const fileExt = doc.fileName.split('.').pop().toLowerCase();
      if (['txt', 'csv', 'json', 'js', 'html', 'css', 'md', 'log'].includes(fileExt)) {
        const textRes = await fetch(presignedUrl);
        if (textRes.ok) {
          const text = await textRes.text();
          setPreviewContent(text);
        } else {
          setPreviewContent('Failed to fetch text content for preview.');
        }
      }
      setPreviewDoc({ ...doc, presignedUrl });
    } catch (err) {
      toast.error(err.message || 'Failed to load preview');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/documents?page=${page}&size=10&sortBy=${sortBy}&sortDir=${sortDir}`);
      setDocuments(response.result.data || []);
      setTotalPages(response.result.totalPages || 1);
      setTotalElements(response.result.totalElements || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      setDepartments(response.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortDir]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (uploadCategory) formData.append('categoryId', uploadCategory);
    if (uploadAccessRole) formData.append('accessRole', uploadAccessRole);
    try {
      await api.post('/documents/upload', formData);
      toast.success(language === 'en' ? 'File uploaded successfully!' : 'Tải lên tài liệu thành công!');
      setFile(null);
      setUploadCategory('');
      setUploadAccessRole('PUBLIC');
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (doc) => {
    setEditingDoc(doc);
    setEditCategory(doc.category ? doc.category.id.toString() : '');
    setEditAccessRole(doc.accessRole || 'PUBLIC');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/documents/${editingDoc.id}?categoryId=${editCategory || ''}&accessRole=${editAccessRole}`);
      toast.success(language === 'en' ? 'Document updated successfully!' : 'Cập nhật tài liệu thành công!');
      setEditingDoc(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await api.get(`/documents/${id}/download`);
      window.open(response.result, '_blank');
    } catch (err) {
      toast.error(err.message || 'Failed to download file');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: language === 'en' ? 'Move to Trash Bin?' : 'Di chuyển vào Thùng rác?',
      message: language === 'en' 
        ? 'Are you sure you want to move this document to the trash bin?' 
        : 'Bạn có chắc chắn muốn di chuyển tài liệu này vào thùng rác không?',
      confirmText: language === 'en' ? 'Move to Trash' : 'Di chuyển',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success(language === 'en' ? 'Document moved to trash bin' : 'Đã chuyển tài liệu vào thùng rác');
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete file');
    }
  };

  const setExpiryPreset = (hours) => {
    if (hours === null) {
      setExpiredAt('');
      return;
    }
    const now = new Date();
    now.setHours(now.getHours() + hours);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    setExpiredAt(`${year}-${month}-${day}T${hour}:${minute}`);
  };

  const fetchActiveShares = async (docId) => {
    setSharesLoading(true);
    try {
      const res = await api.get(`/documents/${docId}/shares`);
      setActiveShares(res.result || []);
    } catch (err) {
      console.error('Failed to fetch active shares', err);
    } finally {
      setSharesLoading(false);
    }
  };

  const handleRevokeShare = async (token) => {
    const isConfirmed = await confirm({
      title: language === 'en' ? 'Revoke Share Link?' : 'Thu hồi link chia sẻ?',
      message: language === 'en' 
        ? 'Are you sure you want to revoke this share link? Users will no longer be able to download the file using this link.' 
        : 'Bạn có chắc chắn muốn thu hồi link chia sẻ này không? Người dùng sẽ không thể tải file qua link này nữa.',
      confirmText: language === 'en' ? 'Revoke' : 'Thu hồi',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/shares/${token}`);
      toast.success(language === 'en' ? 'Share link revoked!' : 'Đã thu hồi link chia sẻ!');
      if (sharingDoc) {
        fetchActiveShares(sharingDoc.id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to revoke share link');
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/documents/${sharingDoc.id}/share`, {
        passcode: passcode || null,
        expiredAt: expiredAt ? new Date(expiredAt).toISOString() : null,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
      });
      setShareResult(response.result);
      toast.success('Share link generated successfully!');
      fetchActiveShares(sharingDoc.id);
    } catch (err) {
      toast.error(err.message || 'Failed to create share link');
    }
  };

  const copyToClipboard = () => {
    if (!shareResult) return;
    navigator.clipboard.writeText(shareResult.shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const cleanStr = dateStr.replace(' ', 'T');
        const fallbackD = new Date(cleanStr);
        return isNaN(fallbackD.getTime()) ? dateStr : fallbackD.toLocaleDateString();
      }
      return d.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? doc.category?.id === parseInt(selectedCategory) : true;
    const matchesTab = viewTab === 'mine' ? doc.uploader?.email === user?.email : true;
    return matchesSearch && matchesCategory && matchesTab;
  });

  const pageStorageBytes = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    {/* Title Header */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            letterSpacing: "-0.5px",
            marginBottom: "8px",
          }}
        >
          {t("sidebar.documents")}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          {t("dashboard.desc")}
        </p>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          setFile(null);
          setUploadCategory("");
          setUploadAccessRole("PUBLIC");
          setShowUploadModal(true);
        }}
      >
        <Upload size={16} />
        {t("dashboard.uploadBtn")}
      </button>
    </div>

    {/* Stats Cards */}
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon-wrapper">
          <Files size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalElements}</span>
          <span className="stat-label">{t("dashboard.totalDocs")}</span>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon-wrapper"
          style={{
            backgroundColor: "var(--success-light)",
            color: "var(--success)",
          }}
        >
          <Database size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{formatSize(pageStorageBytes)}</span>
          <span className="stat-label">{t("dashboard.pageStorage")}</span>
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{
                width: `${Math.min((pageStorageBytes / (100 * 1024 * 1024)) * 100, 100)}%`,
                backgroundColor: "var(--success)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon-wrapper"
          style={{
            backgroundColor: "var(--warning-light)",
            color: "var(--warning)",
          }}
        >
          <Folder size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{categories.length}</span>
          <span className="stat-label">{t("dashboard.activeCats")}</span>
        </div>
      </div>
    </div>

      {/* Document list & Filters */}
      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}
      >
        {/* View Switcher Tabs (Segmented Controls) */}
        <div className="tab-container">
          <button
            onClick={() => setViewTab("all")}
            className={`tab-btn ${viewTab === "all" ? "active" : ""}`}
          >
            {language === "en" ? "All Documents" : "Tất cả tài liệu"}
          </button>
          <button
            onClick={() => setViewTab("mine")}
            className={`tab-btn ${viewTab === "mine" ? "active" : ""}`}
          >
            {language === "en" ? "My Documents" : "Tài liệu của tôi"}
          </button>
        </div>

        {/* Controls Header */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder={t("dashboard.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "38px", paddingRight: "48px" }}
            />
            <span className="search-shortcut">⌘K</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "220px",
            }}
          >
            <Filter size={16} color="var(--text-secondary)" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t("dashboard.allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("dashboard.colName")}</th>
                  <th>{t("category.title")}</th>
                  <th>{t("dashboard.colSize")}</th>
                  <th>{t("dashboard.colUploader")}</th>
                  <th>{t("dashboard.colCreated")}</th>
                  <th style={{ textAlign: "right" }}>
                    {t("dashboard.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          className="skeleton"
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                          }}
                        />
                        <div
                          className="skeleton skeleton-text"
                          style={{ width: "160px" }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="skeleton skeleton-badge" />
                    </td>
                    <td>
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "60px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "80px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "100px" }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <div
                          className="skeleton"
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                          }}
                        />
                        <div
                          className="skeleton"
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                          }}
                        />
                        <div
                          className="skeleton"
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div
            style={{
              padding: "60px 0",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            {t("dashboard.noDocs")}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th
                    onClick={() => toggleSort("fileName")}
                    style={{ cursor: "pointer", width: "30%", minWidth: "220px" }}
                  >
                    {t("dashboard.colName")}{" "}
                    <ArrowUpDown size={12} style={{ marginLeft: "4px" }} />
                  </th>
                  <th style={{ minWidth: "120px" }}>{t("category.title")}</th>
                  <th style={{ minWidth: "100px" }}>{language === "en" ? "Visibility" : "Phạm vi"}</th>
                  <th
                    onClick={() => toggleSort("fileSize")}
                    style={{ cursor: "pointer", minWidth: "90px" }}
                  >
                    {t("dashboard.colSize")}{" "}
                    <ArrowUpDown size={12} style={{ marginLeft: "4px" }} />
                  </th>
                  <th style={{ minWidth: "120px" }}>{t("dashboard.colUploader")}</th>
                  <th
                    onClick={() => toggleSort("createdAt")}
                    style={{ cursor: "pointer", minWidth: "100px" }}
                  >
                    {t("dashboard.colCreated")}{" "}
                    <ArrowUpDown size={12} style={{ marginLeft: "4px" }} />
                  </th>
                  <th style={{ textAlign: "right", minWidth: "150px" }}>
                    {t("dashboard.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {getFileIcon(doc.fileName)}
                        <span
                          style={{
                            fontWeight: 500,
                            wordBreak: "break-all",
                            display: "inline-block",
                          }}
                        >
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td>
                      {doc.category ? (
                        <span className="badge badge-accent">
                          {doc.category.name}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "13px",
                          }}
                        >
                          {language === "en" ? "Unassigned" : "Chưa phân loại"}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${doc.accessRole === "PUBLIC" || !doc.accessRole ? "badge-success" : "badge-accent"}`}
                        style={{ textTransform: "uppercase", fontSize: "11px" }}
                      >
                        {doc.accessRole === "PUBLIC" || !doc.accessRole
                          ? (language === "en" ? "Public" : "Công khai")
                          : doc.accessRole.replace("ROLE_", "").toUpperCase()}
                      </span>
                    </td>
                    <td>{formatSize(doc.fileSize)}</td>
                    <td>{doc.uploader?.fullName || "System"}</td>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-text"
                          onClick={() => handlePreview(doc)}
                          title={t("dashboard.actionPreview")}
                          style={{ padding: "6px", color: "var(--accent)" }}
                        >
                          <Eye size={16} />
                        </button>
                        {(user?.roles?.some(r => r.name === "ADMIN") || user?.email?.startsWith("admin") || doc.uploader?.email === user?.email) && (
                          <button
                            className="btn btn-text"
                            onClick={() => handleEditClick(doc)}
                            title={language === 'en' ? 'Edit Properties' : 'Chỉnh sửa'}
                            style={{ padding: "6px", color: "var(--accent)" }}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button
                          className="btn btn-text"
                          onClick={() => handleDownload(doc.id)}
                          title={t("dashboard.actionDownload")}
                          style={{ padding: "6px" }}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="btn btn-text"
                          onClick={() => {
                            setSharingDoc(doc);
                            setPasscode("");
                            setExpiredAt("");
                            setMaxDownloads("");
                            setShareResult(null);
                            fetchActiveShares(doc.id);
                          }}
                          title={t("dashboard.actionShare")}
                          style={{ padding: "6px" }}
                        >
                          <Share2 size={16} color="var(--accent)" />
                        </button>
                        <button
                          className="btn btn-text"
                          onClick={() => handleDelete(doc.id)}
                          title={t("dashboard.actionDelete")}
                          style={{ padding: "6px", color: "var(--danger)" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              {t("trash.prev")}
            </button>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {t("trash.pageOf", { page, totalPages })}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              {t("trash.next")}
            </button>
          </div>
        )}
      </div>

    {/* Upload Modal Overlay */}
    {showUploadModal && (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: "500px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
              {t("dashboard.uploadTitle")}
            </h3>
            <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)} style={{ padding: "4px 10px", fontSize: "12px" }}>
              {t("common.close")}
            </button>
          </div>

          <form
            onSubmit={handleUpload}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              className={`upload-zone ${isDragging ? "active" : ""}`}
              onClick={() => document.getElementById("file-input").click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload
                size={32}
                color="var(--text-muted)"
                style={{ margin: "0 auto 12px" }}
              />
              {file ? (
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      wordBreak: "break-all"
                    }}
                  >
                    {file.name}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {formatSize(file.size)}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>
                    {t("dashboard.dragDropText")}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {language === "en"
                      ? "Support PDF, DOC, PNG, JPG... Max 10MB"
                      : "Hỗ trợ PDF, DOC, PNG, JPG... Tối đa 10MB"}
                  </p>
                </div>
              )}
              <input
                id="file-input"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                {t("dashboard.assignCat")}
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
              >
                <option value="">{t("dashboard.selectCat")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                {language === "en" ? "Access Visibility" : "Phạm vi chia sẻ (Phòng ban)"}
              </label>
              <select
                value={uploadAccessRole}
                onChange={(e) => setUploadAccessRole(e.target.value)}
              >
                <option value="PUBLIC">{language === "en" ? "Public (Everyone)" : "Công khai (Tất cả)"}</option>
                {departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name.replace("ROLE_", "").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={!file || uploading}
              style={{ justifyContent: "center" }}
            >
              {uploading ? t("dashboard.uploading") : t("dashboard.uploadBtn")}
            </button>
          </form>
        </div>
      </div>
    )}

    {/* Share Modal */}
    {sharingDoc && (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: "600px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.5px", margin: 0 }}>
              {t("dashboard.shareModalTitle")}
            </h3>
            <button className="btn btn-secondary" onClick={() => setSharingDoc(null)} style={{ padding: "4px 10px", fontSize: "12px" }}>
              {t("common.close")}
            </button>
          </div>
          
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            {t("dashboard.shareModalDesc")}{" "}
            <strong style={{ color: "var(--text-primary)" }}>{sharingDoc.fileName}</strong>
          </p>

          {/* Active Share Links Section */}
          <div style={{ marginBottom: "24px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>
              {language === "en" ? "Existing Share Links" : "Các link chia sẻ đang hoạt động"} ({activeShares.length})
            </h4>
            {sharesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "12px" }}>
                <Loader className="animate-spin" size={20} color="var(--accent)" />
              </div>
            ) : activeShares.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                {language === "en" ? "No active share links for this document." : "Chưa có link chia sẻ nào cho tài liệu này."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                {activeShares.map((share) => {
                  const isExpired = share.expiredAt && new Date(share.expiredAt) < new Date();
                  const isMaxedOut = share.maxDownloads && share.downloadCount >= share.maxDownloads;
                  const isActive = !isExpired && !isMaxedOut;

                  return (
                    <div key={share.shareToken} style={{
                      padding: "12px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                        <input
                          type="text"
                          readOnly
                          value={share.shareUrl}
                          style={{
                            flex: 1,
                            fontSize: "12px",
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                            textDecoration: isActive ? "none" : "line-through",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        />
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(share.shareUrl);
                            toast.success(language === "en" ? "Copied!" : "Đã sao chép!");
                          }}
                          style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                        >
                          {language === "en" ? "Copy" : "Sao chép"}
                        </button>
                        <button
                          className="btn btn-text"
                          onClick={() => handleRevokeShare(share.shareToken)}
                          style={{ padding: "4px", color: "var(--danger)" }}
                          title={language === "en" ? "Revoke Link" : "Thu hồi link"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px", fontSize: "11px", color: "var(--text-secondary)" }}>
                        <span>
                          🔑 Pass: {share.passcode ? <strong style={{ color: "var(--text-primary)" }}>{share.passcode}</strong> : <em>None</em>}
                        </span>
                        <span>
                          📥 Downloads: {share.downloadCount}{share.maxDownloads ? `/${share.maxDownloads}` : " (Unlimited)"}
                        </span>
                        <span style={{ color: isActive ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                          {isExpired 
                            ? (language === "en" ? "Expired" : "Hết hạn") 
                            : isMaxedOut 
                              ? (language === "en" ? "Maxed downloads" : "Hết lượt tải") 
                              : share.expiredAt 
                                ? (language === "en" 
                                    ? `Expires: ${new Date(share.expiredAt).toLocaleString()}` 
                                    : `Hết hạn: ${new Date(share.expiredAt).toLocaleString()}`) 
                                : (language === "en" ? "Never expires" : "Vô thời hạn")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Share Generation Section */}
          {!shareResult ? (
            <form
              onSubmit={handleShareSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                {language === "en" ? "Generate New Share Link" : "Tạo link chia sẻ mới"}
              </h4>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  <Lock size={14} /> {t("dashboard.passcodeLabel")}
                </label>
                <input
                  type="password"
                  placeholder={t("dashboard.passcodePlaceholder")}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  <Calendar size={14} /> {t("dashboard.expiryLabel")}
                </label>
                <input
                  type="datetime-local"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setExpiryPreset(1)}
                    style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                  >
                    +1 {language === "en" ? "Hour" : "Giờ"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setExpiryPreset(24)}
                    style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                  >
                    +1 {language === "en" ? "Day" : "Ngày"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setExpiryPreset(168)}
                    style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                  >
                    +7 {language === "en" ? "Days" : "Ngày"}
                  </button>
                  {expiredAt && (
                    <button
                      type="button"
                      className="btn btn-text"
                      onClick={() => setExpiryPreset(null)}
                      style={{ padding: "4px 8px", fontSize: "11px", height: "auto", color: "var(--danger)" }}
                    >
                      {language === "en" ? "Clear" : "Bỏ chọn"}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  {t("dashboard.maxDownloadsLabel")}
                </label>
                <input
                  type="number"
                  placeholder={t("dashboard.maxDownloadsPlaceholder")}
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  min={1}
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: "100%", marginTop: "10px", justifyContent: "center" }}
              >
                {t("dashboard.generateShareBtn")}
              </button>
            </form>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--success)" }}>
                🎉 {language === "en" ? "New Share Link Created!" : "Đã tạo link chia sẻ mới thành công!"}
              </h4>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  {language === "en" ? "Sharing URL:" : "Đường dẫn chia sẻ:"}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={shareResult.shareUrl}
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                    }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={copyToClipboard}
                    style={{ padding: "6px 10px" }}
                  >
                    {copied ? (
                      <Check size={14} color="var(--success)" />
                    ) : (
                      <Clipboard size={14} />
                    )}
                  </button>
                </div>
              </div>

              {shareResult.passcode && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  🔑{" "}
                  {language === "en" ? "Access passcode:" : "Mật mã truy cập:"}{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {shareResult.passcode}
                  </strong>
                </p>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => setShareResult(null)}
                style={{ width: "100%", marginTop: "10px" }}
              >
                {language === "en" ? "Create Another Link" : "Tạo thêm link khác"}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Preview Modal */}
    {previewDoc && (
      <div className="modal-overlay">
        <div className="modal-content modal-content-large">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "-0.5px",
                }}
              >
                {language === "en" ? "Preview:" : "Xem trước:"}{" "}
                {previewDoc.fileName}
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  marginTop: "2px",
                }}
              >
                {formatSize(previewDoc.fileSize)} | {previewDoc.fileType}
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setPreviewDoc(null)}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              {t("common.close")}
            </button>
          </div>

          <div className="preview-container">
            {previewLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Loader
                  className="animate-spin"
                  size={24}
                  color="var(--accent)"
                />
                <span
                  style={{ fontSize: "13px", color: "var(--text-secondary)" }}
                >
                  {t("shareView.loadingPreview")}
                </span>
              </div>
            ) : previewDoc.presignedUrl ? (
              (() => {
                const ext = previewDoc.fileName.split(".").pop().toLowerCase();
                if (
                  ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)
                ) {
                  return (
                    <img
                      src={previewDoc.presignedUrl}
                      alt={previewDoc.fileName}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "500px",
                        objectFit: "contain",
                      }}
                    />
                  );
                } else if (ext === "pdf") {
                  return (
                    <iframe
                      src={`${previewDoc.presignedUrl}#toolbar=0`}
                      title={previewDoc.fileName}
                      width="100%"
                      height="500px"
                      style={{ border: "none", borderRadius: "4px" }}
                    />
                  );
                } else if (
                  [
                    "txt",
                    "csv",
                    "json",
                    "js",
                    "html",
                    "css",
                    "md",
                    "log",
                  ].includes(ext)
                ) {
                  return <pre className="preview-text">{previewContent}</pre>;
                } else {
                  return (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <p style={{ marginBottom: "16px", fontSize: "14px" }}>
                        {t("shareView.previewNotSupported", { ext })}
                      </p>
                      <a
                        href={previewDoc.presignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        <Download size={14} style={{ marginRight: "6px" }} />
                        {t("shareView.downloadBtn")}
                      </a>
                    </div>
                  );
                }
              })()
            ) : (
              <div style={{ color: "var(--danger)", fontSize: "13px" }}>
                Failed to generate preview URL.
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Edit Document Modal */}
    {editingDoc && (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: "500px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.5px", margin: 0 }}>
              {language === "en" ? "Edit Document Properties" : "Chỉnh sửa thông tin tài liệu"}
            </h3>
            <button className="btn btn-secondary" onClick={() => setEditingDoc(null)} style={{ padding: "4px 10px", fontSize: "12px" }}>
              {t("common.close")}
            </button>
          </div>
          
          <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                {t("dashboard.colName")}
              </label>
              <input
                type="text"
                className="input-field"
                value={editingDoc.fileName}
                disabled
                style={{ width: "100%", opacity: 0.7 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                {t("category.title")}
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">{t("dashboard.selectCat")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                {language === "en" ? "Access Visibility" : "Phạm vi chia sẻ (Phòng ban)"}
              </label>
              <select
                value={editAccessRole}
                onChange={(e) => setEditAccessRole(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="PUBLIC">{language === "en" ? "Public (Everyone)" : "Công khai (Tất cả)"}</option>
                {departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name.replace("ROLE_", "").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", marginTop: "8px" }}>
              {t("common.submit")}
            </button>
          </form>
        </div>
      </div>
    )}
  </div>
);
}
