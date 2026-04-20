import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { phishingEmployeeApi } from "../../api/phishingClient";
import type { MessageDetail } from "../../api/phishingClient";

const DIFF_COLOR: Record<string, string> = {
  easy: "#3fb950",
  medium: "#e3b341",
  hard: "#da3633",
};

const PhishingMessage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const aid = Number(assignmentId);

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    phishingEmployeeApi
      .getMessage(aid)
      .then(setMessage)
      .catch(() => setError("Could not load this message."))
      .finally(() => setLoading(false));
  }, [aid]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (text: string, color = "#238636") => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReport = async () => {
    try {
      await phishingEmployeeApi.reportPhishing(aid);
      setMessage((prev) => (prev ? { ...prev, is_reported: true } : prev));
      showToast("✅ Reported as phishing — great catch!", "#238636");
    } catch {
      showToast("Failed to report", "#da3633");
    }
    setMenuOpen(false);
  };

  const handleSpam = async () => {
    try {
      await phishingEmployeeApi.markSpam(aid);
      setMessage((prev) => (prev ? { ...prev, is_spam_marked: true } : prev));
      showToast("🚫 Marked as spam", "#8b949e");
    } catch {
      showToast("Failed to mark as spam", "#da3633");
    }
    setMenuOpen(false);
  };

  const handleCtaClick = async () => {
    try {
      await phishingEmployeeApi.recordClick(aid);
      setMessage((prev) => (prev ? { ...prev, is_clicked: true } : prev));
    } catch {
      // Continue even if recording fails
    }
    navigate(`/employee/phishing/landing/${aid}`);
  };

  if (loading) {
    return <div style={s.page}><div style={{ color: "#58a6ff", padding: 40 }}>Loading message…</div></div>;
  }

  if (error || !message) {
    return <div style={s.page}><div style={{ color: "#f85149", padding: 40 }}>{error || "Message not found"}</div></div>;
  }

  const diffColor = DIFF_COLOR[message.difficulty] || "#8b949e";

  return (
    <div style={s.page}>
      {toast && <div style={{ ...s.toast, background: toast.color }}>{toast.text}</div>}

      <div style={s.appBar}>
        <button style={s.backBtn} onClick={() => navigate("/employee/phishing/inbox")}>← Back to Inbox</button>
        <span style={{ color: "#8b949e", fontSize: 13, marginLeft: "auto" }}>Simulation Inbox</span>
      </div>

      <div style={s.container}>
        <div style={s.subjectRow}>
          <h1 style={s.subject}>{message.subject}</h1>
          <span style={{ ...s.diffBadge, background: diffColor + "22", color: diffColor, border: `1px solid ${diffColor}44` }}>
            {message.difficulty}
          </span>
        </div>

        <div style={s.actionBar}>
          <button
            style={{ ...s.actionBtn, ...(message.is_reported ? { background: "#23863622", color: "#3fb950", borderColor: "#23863644" } : {}) }}
            onClick={handleReport}
            disabled={message.is_reported}
          >
            🎣 {message.is_reported ? "Reported" : "Report Phishing"}
          </button>
          <button
            style={{ ...s.actionBtn, ...(message.is_spam_marked ? { background: "#8b949e22", color: "#8b949e" } : {}) }}
            onClick={handleSpam}
            disabled={message.is_spam_marked}
          >
            🚫 {message.is_spam_marked ? "Marked Spam" : "Mark as Spam"}
          </button>
          <button style={s.actionBtn} onClick={() => navigate(`/employee/phishing/awareness/${aid}`)}>
            📊 View My Result
          </button>
          <div style={{ marginLeft: "auto", position: "relative" }} ref={menuRef}>
            <button style={s.menuBtn} onClick={() => setMenuOpen((v) => !v)} title="More options">⋮</button>
            {menuOpen && (
              <div style={s.menu}>
                <div style={s.menuItem} onClick={handleReport}>🎣 Report as Phishing</div>
                <div style={s.menuItem} onClick={handleSpam}>🚫 Mark as Spam</div>
                <div style={s.menuDivider} />
                <div style={{ ...s.menuItem, color: "#8b949e" }}>📩 Mark as Unread</div>
              </div>
            )}
          </div>
        </div>

        <div style={s.senderRow}>
          <div style={s.avatar}>{(message.sender_name[0] || "?").toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={s.senderName}>{message.sender_name}</div>
            <div style={s.senderEmail}>&lt;{message.sender_email_display}&gt;</div>
            <div style={s.receivedDate}>to me • {new Date(message.received_at).toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {message.is_reported && <Pill text="Reported" color="#3fb950" />}
            {message.is_spam_marked && <Pill text="Spam" color="#8b949e" />}
            {message.is_clicked && <Pill text="Clicked" color="#e3b341" />}
          </div>
        </div>

        <div style={s.emailBody}>
          <div dangerouslySetInnerHTML={{ __html: message.message_body }} style={{ lineHeight: 1.8, fontSize: 15, color: "#374151" }} />
          <div style={{ marginTop: 28 }}>
            <button style={s.ctaBtn} onClick={handleCtaClick}>{message.cta_text}</button>
          </div>
          <div style={s.watermark}>🛡️ CyberShield Phishing Simulation — Internal Training Exercise</div>
        </div>
      </div>
    </div>
  );
};

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: color + "22", color, border: `1px solid ${color}44` }}>
    {text}
  </span>
);

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d1117", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  toast: { position: "fixed", top: 20, right: 20, zIndex: 999, color: "#fff", fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" },
  appBar: { display: "flex", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid #21262d" },
  backBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  container: { maxWidth: 860, margin: "24px auto", background: "#161b22", border: "1px solid #30363d", borderRadius: 8, overflow: "hidden" },
  subjectRow: { display: "flex", alignItems: "center", gap: 12, padding: "20px 28px 0" },
  subject: { color: "#e6edf3", fontSize: 22, fontWeight: 700, margin: 0, flex: 1 },
  diffBadge: { fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 12, textTransform: "capitalize", flexShrink: 0 },
  actionBar: { display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", borderBottom: "1px solid #21262d" },
  actionBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.15s" },
  menuBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  menu: { position: "absolute", right: 0, top: 36, zIndex: 50, background: "#1c2128", border: "1px solid #30363d", borderRadius: 8, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" },
  menuItem: { padding: "10px 16px", color: "#c9d1d9", fontSize: 14, cursor: "pointer" },
  menuDivider: { borderTop: "1px solid #30363d" },
  senderRow: { display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 28px", borderBottom: "1px solid #21262d" },
  avatar: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  senderName: { color: "#e6edf3", fontWeight: 700, fontSize: 15 },
  senderEmail: { color: "#8b949e", fontSize: 13, marginTop: 2 },
  receivedDate: { color: "#8b949e", fontSize: 12, marginTop: 4 },
  emailBody: { background: "#fff", margin: 24, borderRadius: 6, padding: "32px 36px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  ctaBtn: { background: "#4f46e5", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 14px rgba(79,70,229,0.4)" },
  watermark: { marginTop: 36, paddingTop: 16, borderTop: "1px solid #e5e7eb", color: "#9ca3af", fontSize: 11, textAlign: "center" },
};

export default PhishingMessage;