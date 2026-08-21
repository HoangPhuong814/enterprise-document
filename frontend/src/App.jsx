import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { useLanguage } from "./context/LanguageContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Category from "./pages/Category";
import Trash from "./pages/Trash";
import ShareView from "./pages/ShareView";
import Announcement from "./pages/Announcement";
import Staff from "./pages/Staff";
import Chat from "./pages/Chat";
import AuditLogs from "./pages/AuditLogs";
import UserSettings from "./pages/UserSettings";
import RolesPermissions from "./pages/RolesPermissions";
import {
  Shield,
  FileText,
  Folder,
  Trash2,
  LogOut,
  User,
  CheckCircle,
  AlertCircle,
  Info,
  Sun,
  Moon,
  Megaphone,
  Users,
  MessageSquare,
  History,
  Settings as SettingsIcon,
  Key,
} from "lucide-react";

function AppContent() {
  const { user, token, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState("documents"); // 'documents', 'categories', 'trash'
  const [publicShareToken, setPublicShareToken] = useState(null);
  const { language, setLanguage, t } = useLanguage();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.body.className = theme === "light" ? "light-theme" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Thêm đoạn code này bên trong AppContent(), dưới các dòng khai báo State:

  useEffect(() => {
    // Chỉ kết nối nếu người dùng đã đăng nhập (có token và user email)
    if (!token || !user?.email) return;

    // Khởi tạo kết nối WebSocket đến server Spring Boot
    const emailParam = encodeURIComponent(user.email);
    const wsUrl = `ws://localhost:8080/ws-notifications?email=${emailParam}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("Đã kết nối kênh thông báo Real-time WebSocket!");
    };

    socket.onmessage = (event) => {
      console.log("Nhận thông báo từ server:", event.data);

      // Tận dụng Event Toast có sẵn của dự án để hiện popup thông báo
      const toastEvent = new CustomEvent("show-toast", {
        detail: {
          message: event.data,
          type: "info", // Sẽ hiện màu xanh dương thông tin
        },
      });
      window.dispatchEvent(toastEvent);
    };

    socket.onclose = () => {
      console.log("Đã ngắt kết nối kênh thông báo WebSocket.");
    };

    socket.onerror = (error) => {
      console.error("Lỗi kết nối WebSocket:", error);
    };

    // Cleanup: Tự động đóng kết nối khi component bị huỷ hoặc người dùng đăng xuất
    return () => {
      socket.close();
    };
  }, [token, user?.email]);

  // Router đơn giản dùng path của URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/shares/")) {
      const parts = path.split("/");
      // URL format: /shares/{token} hoặc /shares/download/{token}
      const tokenVal = parts[parts.length - 1] || parts[parts.length - 2];
      setPublicShareToken(tokenVal);
    }
  }, []);

  // Nếu là trang public share link, không cần kiểm tra đăng nhập
  if (publicShareToken) {
    return <ShareView token={publicShareToken} />;
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090a0c",
        }}
      >
        <p style={{ color: "var(--text-secondary)" }}>
          {t("common.loadingSession")}
        </p>
      </div>
    );
  }

  // Nếu chưa đăng nhập, render trang Auth
  if (!token) {
    return <Auth />;
  }

  // Render Layout chính của ứng dụng
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      {/* Sidebar bên trái */}
      <aside
        style={{
          width: "260px",
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 16px",
          position: "fixed",
          height: "100vh",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 8px",
            }}
          >
            <Shield size={22} color="#5e6ad2" />
            <span
              style={{
                fontWeight: 600,
                fontSize: "16px",
                letterSpacing: "-0.5px",
              }}
            >
              {t("sidebar.title")}
            </span>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              onClick={() => setCurrentTab("documents")}
              className={`sidebar-link ${currentTab === "documents" ? "active" : ""}`}
            >
              <FileText size={18} />
              {t("sidebar.documents")}
            </button>

            <button
              onClick={() => setCurrentTab("categories")}
              className={`sidebar-link ${currentTab === "categories" ? "active" : ""}`}
            >
              <Folder size={18} />
              {t("sidebar.categories")}
            </button>

            <button
              onClick={() => setCurrentTab("trash")}
              className={`sidebar-link ${currentTab === "trash" ? "active" : ""}`}
            >
              <Trash2 size={18} />
              {t("sidebar.trash")}
            </button>

            <button
              onClick={() => setCurrentTab("announcements")}
              className={`sidebar-link ${currentTab === "announcements" ? "active" : ""}`}
            >
              <Megaphone size={18} />
              {t("sidebar.announcements")}
            </button>

            <button
              onClick={() => setCurrentTab("chat")}
              className={`sidebar-link ${currentTab === "chat" ? "active" : ""}`}
            >
              <MessageSquare size={18} />
              {t("sidebar.chat")}
            </button>

            <button
              onClick={() => setCurrentTab("settings")}
              className={`sidebar-link ${currentTab === "settings" ? "active" : ""}`}
            >
              <SettingsIcon size={18} />
              {t("sidebar.settings")}
            </button>

            {(user?.email?.startsWith("admin") || user?.roles?.some(r => r.name === "ADMIN")) && (
              <>
                <button
                  onClick={() => setCurrentTab("staff")}
                  className={`sidebar-link ${currentTab === "staff" ? "active" : ""}`}
                >
                  <Users size={18} />
                  {t("sidebar.staff")}
                </button>

                <button
                  onClick={() => setCurrentTab("auditLogs")}
                  className={`sidebar-link ${currentTab === "auditLogs" ? "active" : ""}`}
                >
                  <History size={18} />
                  {t("sidebar.auditLogs")}
                </button>

                <button
                  onClick={() => setCurrentTab("rolesPermissions")}
                  className={`sidebar-link ${currentTab === "rolesPermissions" ? "active" : ""}`}
                >
                  <Key size={18} />
                  {t("sidebar.rolesPermissions")}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer Sidebar (Language Switcher, User Info & Logout) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {/* Language Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: "var(--bg-tertiary)",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              {language === "en" ? "Language" : "Ngôn ngữ"}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setLanguage("en")}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background:
                    language === "en" ? "var(--accent)" : "transparent",
                  color: language === "en" ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "11px",
                }}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("vi")}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background:
                    language === "vi" ? "var(--accent)" : "transparent",
                  color: language === "vi" ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "11px",
                }}
              >
                VI
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              <User size={16} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {user?.email?.startsWith("admin")
                  ? t("sidebar.admin")
                  : t("sidebar.user")}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "13px",
              justifyContent: "center",
            }}
          >
            <LogOut size={14} />
            {t("sidebar.signOut")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          marginLeft: "260px",
          flex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar header */}
        <header className="main-header">
          <div
            style={{
              display: "flex",
              gap: "8px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            <span>
              {language === "en" ? "Workspace" : "Không gian làm việc"}
            </span>
            <span>/</span>
            <span
              style={{
                color: "var(--text-primary)",
                textTransform: "capitalize",
              }}
            >
              {currentTab === "documents"
                ? t("sidebar.documents")
                : currentTab === "categories"
                  ? t("sidebar.categories")
                  : currentTab === "trash"
                    ? t("sidebar.trash")
                    : currentTab === "announcements"
                      ? t("sidebar.announcements")
                      : currentTab === "chat"
                        ? t("sidebar.chat")
                        : currentTab === "auditLogs"
                          ? t("sidebar.auditLogs")
                          : currentTab === "settings"
                            ? t("sidebar.settings")
                            : currentTab === "rolesPermissions"
                              ? t("sidebar.rolesPermissions")
                              : t("sidebar.staff")}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "var(--bg-tertiary)",
              width: "36px",
              height: "36px",
            }}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* Content body */}
        <div
          style={{
            padding: "32px",
            flex: 1,
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {currentTab === "documents" && <Dashboard />}
          {currentTab === "categories" && <Category />}
          {currentTab === "trash" && <Trash />}
          {currentTab === "announcements" && <Announcement />}
          {currentTab === "chat" && <Chat />}
          {currentTab === "staff" && (user?.email?.startsWith("admin") || user?.roles?.some(r => r.name === "ADMIN")) && <Staff />}
          {currentTab === "auditLogs" && (user?.email?.startsWith("admin") || user?.roles?.some(r => r.name === "ADMIN")) && <AuditLogs />}
          {currentTab === "settings" && <UserSettings />}
          {currentTab === "rolesPermissions" && (user?.email?.startsWith("admin") || user?.roles?.some(r => r.name === "ADMIN")) && <RolesPermissions />}
        </div>
      </main>
    </div>
  );
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" && (
            <CheckCircle size={16} color="var(--success)" />
          )}
          {t.type === "error" && (
            <AlertCircle size={16} color="var(--danger)" />
          )}
          {t.type === "info" && <Info size={16} color="var(--accent)" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <AppContent />
        <ToastContainer />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
