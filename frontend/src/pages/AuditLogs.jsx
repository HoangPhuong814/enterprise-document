import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../services/api";
import { Loader, Search, RefreshCw } from "lucide-react";
import { toast } from "../services/toast";

export default function AuditLogs() {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [size] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/activity-logs?page=${page}&size=${size}&search=${encodeURIComponent(search)}&action=${action}`
      );
      const result = res.result;
      if (result) {
        setLogs(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotalElements(result.totalElements || 0);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      toast.error(
        language === "en"
          ? "Failed to fetch audit logs"
          : "Không thể lấy lịch sử hoạt động"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    try {
      const date = new Date(ts);
      return date.toLocaleString(language === "en" ? "en-US" : "vi-VN");
    } catch (e) {
      return ts;
    }
  };

  const getActionBadge = (act) => {
    let text = act;
    let color = "var(--text-secondary)";
    let bgColor = "var(--bg-tertiary)";
    
    if (act === "UPLOAD_DOCUMENT") {
      text = language === "en" ? "UPLOAD" : "TẢI LÊN";
      color = "#10b981";
      bgColor = "rgba(16, 185, 129, 0.1)";
    } else if (act === "DOWNLOAD_DOCUMENT") {
      text = language === "en" ? "DOWNLOAD" : "TẢI XUỐNG";
      color = "#3b82f6";
      bgColor = "rgba(59, 130, 246, 0.1)";
    } else if (act === "DELETE_DOCUMENT") {
      text = language === "en" ? "DELETE" : "XÓA";
      color = "#ef4444";
      bgColor = "rgba(239, 68, 68, 0.1)";
    }

    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 600,
          color: color,
          backgroundColor: bgColor,
          border: `1px solid ${color}22`
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.5px", marginBottom: "8px" }}>
            {t("auditLogs.title")}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {t("auditLogs.desc")}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchLogs}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "8px", height: "40px" }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "280px", display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)"
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder={t("auditLogs.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "40px", width: "100%", height: "40px" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: "40px" }}>
            {language === "en" ? "Search" : "Tìm kiếm"}
          </button>
        </form>

        <div style={{ minWidth: "200px" }}>
          <select
            className="input-field"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", height: "40px", cursor: "pointer" }}
          >
            <option value="ALL">{t("auditLogs.allActions")}</option>
            <option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option>
            <option value="DOWNLOAD_DOCUMENT">DOWNLOAD_DOCUMENT</option>
            <option value="DELETE_DOCUMENT">DELETE_DOCUMENT</option>
          </select>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="card">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <Loader className="animate-spin" size={28} color="var(--accent)" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
            {t("auditLogs.noLogs")}
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>{t("auditLogs.colUser")}</th>
                    <th>{t("auditLogs.colAction")}</th>
                    <th>{t("auditLogs.colDoc")}</th>
                    <th>{t("auditLogs.colTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((logItem, index) => (
                    <tr key={logItem.id ? `${logItem.id}-${index}` : index}>
                      <td style={{ fontWeight: 500, fontSize: "14px" }}>
                        {logItem.userEmail}
                      </td>
                      <td>
                        {getActionBadge(logItem.action)}
                      </td>
                      <td style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: "13px" }}>
                        {logItem.documentName}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                        {formatTimestamp(logItem.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border-color)",
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
                <span style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
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
          </>
        )}
      </div>
    </div>
  );
}
