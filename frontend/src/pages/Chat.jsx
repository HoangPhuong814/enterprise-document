import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../services/api";
import { toast } from "../services/toast";
import {
  Send,
  Paperclip,
  Search,
  Download,
  Loader,
  X,
  FileText,
  User as UserIcon,
  Users as UsersIcon,
  MessageSquare,
  Lock,
  Calendar,
  Layers,
} from "lucide-react";

export default function Chat() {
  const { user, token } = useAuth();
  const { language, t } = useLanguage();

  // Navigation & Lists
  const [chatUsers, setChatUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected conversation: { type: 'dm' | 'department', id: string | number, name: string, detail: any }
  const [activeConv, setActiveConv] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  // File sharing modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Cache for loaded document metadata to prevent duplicate requests
  const [docMetadataCache, setDocMetadataCache] = useState({});

  // WebSocket ref
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Store activeConv in a ref so the WebSocket event handler can always read the latest selected conversation without re-triggering the socket connection effect
  const activeConvRef = useRef(activeConv);
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Store user in a ref to avoid stale closures in WebSocket event listeners
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 1. Initial data fetching (users, roles)
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      try {
        // Fetch all users for DM
        const usersRes = await api.get("/users/chat-list");
        const list = usersRes.result || [];
        // Exclude current user from DM list
        setChatUsers(list.filter(u => u.email !== user?.email));

        // Fetch all roles/departments
        const rolesRes = await api.get("/users/departments");
        setDepartments(rolesRes.result || []);
      } catch (err) {
        console.error("Failed to load chat users/departments:", err);
        toast.error(language === "en" ? "Failed to load chat participants" : "Không thể tải danh sách người dùng");
      }
    };

    fetchData();
  }, [token, user?.email]);

  // 2. Establish WebSocket connection for real-time chat
  useEffect(() => {
    if (!token || !user?.email) return;

    let socket;
    let reconnectTimeout;
    let isComponentMounted = true;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      const emailParam = encodeURIComponent(user.email);
      const wsUrl = `ws://localhost:8080/ws-chat?email=${emailParam}`;
      console.log("Connecting to Chat WebSocket...");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isComponentMounted) return;
        console.log("Chat WebSocket Connected!");
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        if (!isComponentMounted) return;
        try {
          const msg = JSON.parse(event.data);
          
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;

            const currentConv = activeConvRef.current;
            const myEmail = userRef.current?.email;
            const isCurrentConv = currentConv && (
              (currentConv.type === "dm" && 
               ((msg.senderEmail === currentConv.detail.email && msg.recipientEmail === myEmail) ||
                (msg.senderEmail === myEmail && msg.recipientEmail === currentConv.detail.email))) ||
              (currentConv.type === "department" && msg.departmentRole === currentConv.id)
            );

            if (isCurrentConv) {
              return [...prev, msg];
            }
            return prev;
          });
        } catch (e) {
          console.error("Failed to parse websocket message:", e);
        }
      };

      socket.onclose = (event) => {
        if (!isComponentMounted) return;
        console.log("Chat WebSocket Closed:", event.reason);
        setWsConnected(false);
        
        reconnectTimeout = setTimeout(() => {
          console.log("Attempting to reconnect Chat WebSocket...");
          connectWebSocket();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.error("Chat WebSocket Error:", error);
      };

      socketRef.current = socket;
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null; // Prevent onclose handler from firing reconnection!
        socket.onerror = null;
        socket.close();
      }
    };
  }, [token, user?.email]);

  // 3. Fetch chat history when active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    
    const fetchHistory = async () => {
      setLoadingHistory(true);
      setMessages([]);
      try {
        let history = [];
        if (activeConv.type === "dm") {
          const res = await api.get(`/chat/history/dm?sender=${encodeURIComponent(user.email)}&recipient=${encodeURIComponent(activeConv.detail.email)}`);
          history = res.result || [];
        } else if (activeConv.type === "department") {
          const res = await api.get(`/chat/history/department/${activeConv.id}`);
          history = res.result || [];
        }
        setMessages(history);
      } catch (err) {
        console.error("Failed to load chat history:", err);
        toast.error(language === "en" ? "Failed to load chat history" : "Không thể tải lịch sử tin nhắn");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activeConv, user?.email]);

  // 4. Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingHistory]);

  // 5. Send message action
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedDoc) return;
    if (!wsConnected || !socketRef.current) {
      toast.error(language === "en" ? "Chat is disconnected. Reconnecting..." : "Mất kết nối trò chuyện. Đang thử lại...");
      return;
    }

    const payload = {
      content: inputText.trim() || (selectedDoc ? selectedDoc.fileName : ""),
      documentId: selectedDoc ? selectedDoc.id : null,
    };

    if (activeConv.type === "dm") {
      payload.recipientEmail = activeConv.detail.email;
    } else {
      payload.departmentRole = activeConv.id;
    }

    try {
      socketRef.current.send(JSON.stringify(payload));
      setInputText("");
      setSelectedDoc(null);
    } catch (err) {
      console.error("Send failed:", err);
      toast.error(language === "en" ? "Failed to send message" : "Gửi tin nhắn thất bại");
    }
  };

  // 6. Attach file selection & upload fetch
  const openAttachModal = async () => {
    setShowAttachModal(true);
    setLoadingDocs(true);
    try {
      // Get first 100 documents of the enterprise
      const res = await api.get("/documents?page=1&size=100");
      setUserDocuments(res.result?.data || []);
    } catch (err) {
      console.error(err);
      toast.error(language === "en" ? "Failed to fetch files list" : "Không thể tải danh sách tài liệu");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setShowAttachModal(false);
  };

  // 7. Helper to download shared documents
  const downloadFile = async (docId) => {
    try {
      const res = await api.get(`/documents/${docId}/download`);
      if (res.result) {
        window.open(res.result, "_blank");
      }
    } catch (err) {
      console.error(err);
      toast.error(language === "en" ? "Failed to generate download URL" : "Không thể tạo liên kết tải về");
    }
  };

  // 8. Load document details lazily if cached info is missing
  const getDocumentInfo = (docId, fallbackName) => {
    if (!docId) return null;
    if (docMetadataCache[docId]) return docMetadataCache[docId];

    // Fetch details asynchronously and store in cache
    api.get(`/documents/${docId}`)
      .then((res) => {
        if (res.result) {
          setDocMetadataCache(prev => ({
            ...prev,
            [docId]: res.result
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not load details for doc " + docId, err);
        // Put fallback in cache to avoid infinite retries
        setDocMetadataCache(prev => ({
          ...prev,
          [docId]: { fileName: fallbackName || "Document Attachment", fileSize: 0, fileType: "unknown" }
        }));
      });

    return { fileName: fallbackName || t("chat.connecting"), loading: true };
  };

  // Filtering lists
  const filteredUsers = chatUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDocs = userDocuments.filter(d =>
    d.fileName.toLowerCase().includes(docSearch.toLowerCase())
  );

  // Formatter for timestamp
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      // Adjust timezone or formatting
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (e) {
      return "";
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 120px)",
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "16px",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* Sidebar List (Users and Departments) */}
      <div
        style={{
          width: "320px",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        {/* Search Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder={t("chat.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 38px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            />
          </div>
        </div>

        {/* Scrollable Room List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Group Rooms Section */}
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "var(--text-muted)",
                paddingLeft: "12px",
                marginBottom: "8px",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <UsersIcon size={12} />
              {t("chat.departments")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredDepartments.map((dept) => {
                const isActive = activeConv?.type === "department" && activeConv?.id === dept.name;
                // Check if user has this role, or is ADMIN, to display accessibility
                const hasRole = user?.roles?.some(r => r.name === dept.name) || user?.roles?.some(r => r.name === "ADMIN");

                return (
                  <button
                    key={dept.id}
                    onClick={() => setActiveConv({ type: "department", id: dept.name, name: dept.name, detail: dept })}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isActive ? "var(--accent-light)" : "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: isActive ? "var(--accent)" : "var(--bg-tertiary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive ? "#fff" : "var(--text-secondary)",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        #
                      </div>
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: isActive ? "var(--accent)" : "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {dept.name}
                          </span>
                          {!hasRole && (
                            <Lock size={11} color="var(--text-muted)" title="No access/Read-only restrict" />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {dept.description || "No description"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredDepartments.length === 0 && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", paddingLeft: "12px" }}>
                  No channels found
                </p>
              )}
            </div>
          </div>

          {/* Users Section */}
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "var(--text-muted)",
                paddingLeft: "12px",
                marginBottom: "8px",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <UserIcon size={12} />
              {t("chat.directMessages")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredUsers.map((chatUser) => {
                const isActive = activeConv?.type === "dm" && activeConv?.detail?.email === chatUser.email;
                const initials = getInitials(chatUser.name);
                const isAdmin = chatUser.roles?.some(r => r.name === "ADMIN");

                return (
                  <button
                    key={chatUser.id}
                    onClick={() => setActiveConv({ type: "dm", id: chatUser.email, name: chatUser.name, detail: chatUser })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isActive ? "var(--accent-light)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: isAdmin ? "rgba(94, 106, 210, 0.2)" : "var(--bg-tertiary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isAdmin ? "var(--accent)" : "var(--text-secondary)",
                        fontWeight: 600,
                        fontSize: "12px",
                        border: isAdmin ? "1px solid var(--accent)" : "none",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: isActive ? "var(--accent)" : "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {chatUser.name}
                        </span>
                        {isAdmin && (
                          <span
                            style={{
                              fontSize: "9px",
                              backgroundColor: "var(--accent-light)",
                              color: "var(--accent)",
                              padding: "1px 4px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            {t("chat.adminBadge")}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {chatUser.email}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", paddingLeft: "12px" }}>
                  No colleagues found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        {activeConv ? (
          <>
            {/* Conversation Header */}
            <div
              style={{
                height: "64px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: wsConnected ? "var(--success)" : "var(--danger)",
                    boxShadow: wsConnected ? "0 0 8px var(--success)" : "none",
                  }}
                  title={wsConnected ? t("chat.connected") : t("chat.disconnected")}
                />
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {activeConv.type === "department" ? `${t("chat.departmentPrefix")}${activeConv.name}` : activeConv.name}
                  </h4>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {activeConv.type === "department" 
                      ? activeConv.detail.description || "Kênh thảo luận chung"
                      : activeConv.detail.email}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: wsConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(224, 92, 92, 0.1)",
                  color: wsConnected ? "var(--success)" : "var(--danger)",
                  fontWeight: 500,
                }}
              >
                {wsConnected ? t("chat.online") : t("chat.connecting")}
              </div>
            </div>

            {/* Message Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                backgroundImage: "radial-gradient(rgba(94, 106, 210, 0.03) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            >
              {loadingHistory ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Loader className="animate-spin" color="var(--accent)" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    gap: "8px",
                  }}
                >
                  <MessageSquare size={36} style={{ strokeWidth: 1.5, opacity: 0.5 }} />
                  <p style={{ fontSize: "13px" }}>
                    {language === "en" ? "Send a message to start the conversation." : "Gửi tin nhắn để bắt đầu cuộc hội thoại."}
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderEmail === user.email;
                  
                  // For department messages, show sender email tag if not me
                  const showSenderName = activeConv.type === "department" && !isMe;
                  
                  // Render doc detail card if documentId is present
                  let docDetails = null;
                  if (msg.documentId) {
                    docDetails = getDocumentInfo(msg.documentId, msg.content);
                  }

                  return (
                    <div
                      key={msg.id || index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                        width: "100%",
                      }}
                    >
                      {showSenderName && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            marginBottom: "4px",
                            marginLeft: "12px",
                            fontWeight: 500,
                          }}
                        >
                          {msg.senderEmail}
                        </span>
                      )}
                      
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "10px 14px",
                          borderRadius: "14px",
                          borderBottomRightRadius: isMe ? "2px" : "14px",
                          borderBottomLeftRadius: isMe ? "14px" : "2px",
                          backgroundColor: isMe ? "var(--accent)" : "var(--bg-tertiary)",
                          color: isMe ? "#fff" : "var(--text-primary)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          fontSize: "13px",
                        }}
                      >
                        {/* Message content */}
                        {!msg.documentId ? (
                          <p style={{ wordBreak: "break-word", whiteSpace: "pre-wrap", margin: 0 }}>
                            {msg.content}
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <p style={{ fontSize: "11px", opacity: 0.8, margin: 0, fontStyle: "italic" }}>
                              {isMe ? t("chat.yourMessage") : msg.senderEmail} {t("chat.fileAttached")}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 12px",
                                backgroundColor: isMe ? "rgba(0, 0, 0, 0.15)" : "var(--bg-secondary)",
                                borderRadius: "8px",
                                border: "1px solid var(--border-subtle)",
                                minWidth: "220px",
                              }}
                            >
                              <div style={{ color: "var(--accent)" }}>
                                <FileText size={20} />
                              </div>
                              <div style={{ overflow: "hidden", flex: 1 }}>
                                <p
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "var(--text-primary)",
                                    margin: 0,
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={docDetails?.fileName || msg.content}
                                >
                                  {docDetails?.fileName || msg.content}
                                </p>
                                {docDetails && !docDetails.loading && (
                                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>
                                    {formatSize(docDetails.fileSize)}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadFile(msg.documentId)}
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  color: "var(--accent)",
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(94, 106, 210, 0.1)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <span
                          style={{
                            fontSize: "10px",
                            color: isMe ? "rgba(255, 255, 255, 0.6)" : "var(--text-muted)",
                            alignSelf: "flex-end",
                          }}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Send Area */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Selected File Attachment Badge */}
              {selectedDoc && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent-light)",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                    fontSize: "12px",
                    alignSelf: "flex-start",
                  }}
                >
                  <FileText size={14} />
                  <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px", whiteSpace: "nowrap" }}>
                    {selectedDoc.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    style={{
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--accent)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={openAttachModal}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  title={t("chat.attachFile")}
                >
                  <Paperclip size={18} />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  placeholder={t("chat.typeMessage")}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    padding: "0 16px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty Chat Area */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              textAlign: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              <MessageSquare size={36} />
            </div>
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "-0.5px" }}>
                {t("chat.welcomeTitle")}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "420px", lineHeight: "1.6" }}>
                {t("chat.welcomeDesc")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Attach File Modal */}
      {showAttachModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "600px",
              width: "90%",
              padding: "24px",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  {t("chat.selectFileTitle")}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {t("chat.selectFileDesc")}
                </span>
              </div>
              <button
                onClick={() => setShowAttachModal(false)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <X size={18} />
              </button>
            </div>

            {/* Doc Search */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder={language === "en" ? "Search documents by name..." : "Tìm kiếm tài liệu theo tên..."}
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </div>

            {/* Documents List */}
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                backgroundColor: "var(--bg-primary)",
              }}
            >
              {loadingDocs ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <Loader className="animate-spin" color="var(--accent)" size={20} />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  {t("chat.noFiles")}
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background-color 0.2s",
                    }}
                    className="doc-attach-item"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", marginRight: "16px" }}>
                      <FileText size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: "hidden" }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {doc.fileName}
                        </p>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {formatSize(doc.fileSize)} • {doc.fileType}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectDoc(doc)}
                      className="btn btn-primary"
                      style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        height: "auto",
                      }}
                    >
                      {language === "en" ? "Select" : "Chọn"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAttachModal(false)}
                style={{ padding: "6px 16px", fontSize: "13px" }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
