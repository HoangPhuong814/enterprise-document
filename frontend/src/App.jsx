import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { useLanguage } from "./context/LanguageContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Category from "./pages/Category";
import Trash from "./pages/Trash";
import ShareView from "./pages/ShareView";
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                background:
                  currentTab === "documents"
                    ? "var(--bg-tertiary)"
                    : "transparent",
                color:
                  currentTab === "documents"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <FileText size={18} />
              {t("sidebar.documents")}
            </button>

            <button
              onClick={() => setCurrentTab("categories")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                background:
                  currentTab === "categories"
                    ? "var(--bg-tertiary)"
                    : "transparent",
                color:
                  currentTab === "categories"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <Folder size={18} />
              {t("sidebar.categories")}
            </button>

            <button
              onClick={() => setCurrentTab("trash")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                background:
                  currentTab === "trash" ? "var(--bg-tertiary)" : "transparent",
                color:
                  currentTab === "trash"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <Trash2 size={18} />
              {t("sidebar.trash")}
            </button>
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
        <header
          style={{
            height: "64px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            backgroundColor: "var(--header-bg, rgba(9, 10, 12, 0.4))",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
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
                  : t("sidebar.trash")}
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
