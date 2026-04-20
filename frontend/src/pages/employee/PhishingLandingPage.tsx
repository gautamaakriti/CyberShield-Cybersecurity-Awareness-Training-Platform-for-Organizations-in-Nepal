import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { phishingEmployeeApi } from "../../api/phishingClient";
import type { MessageDetail } from "../../api/phishingClient";

const PhishingLandingPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const aid = Number(assignmentId);

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    phishingEmployeeApi
      .getMessage(aid)
      .then(setMessage)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [aid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await phishingEmployeeApi.submitCredentials(aid);
    } catch {
      // Continue even on error
    }
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => navigate(`/employee/phishing/awareness/${aid}`), 1600);
  };

  if (loading || !message) {
    return <Wrapper><div style={{ color: "#8b949e" }}>Loading…</div></Wrapper>;
  }

  const type = message.landing_page_type;

  return (
    <Wrapper>
      <div style={s.ribbon}>🛡️ CyberShield Internal Training Simulation</div>

      {type === "fake_login" && (
        <LoginPage senderName={message.sender_name} email={email} password={password} setEmail={setEmail} setPassword={setPassword} submitting={submitting} submitted={submitted} onSubmit={handleSubmit} />
      )}
      {type === "fake_verification" && (
        <VerificationPage senderName={message.sender_name} code={code} setCode={setCode} submitting={submitting} submitted={submitted} onSubmit={handleSubmit} />
      )}
      {type === "fake_attachment" && (
        <AttachmentPage senderName={message.sender_name} email={email} password={password} setEmail={setEmail} setPassword={setPassword} submitting={submitting} submitted={submitted} onSubmit={handleSubmit} />
      )}
    </Wrapper>
  );
};

// ── Fake Login Page ───────────────────────────────────────────────────────────

interface LoginProps {
  senderName: string; email: string; password: string;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  submitting: boolean; submitted: boolean; onSubmit: (e: React.FormEvent) => void;
}

const LoginPage: React.FC<LoginProps> = ({ senderName, email, password, setEmail, setPassword, submitting, submitted, onSubmit }) => (
  <div style={s.card}>
    <OrgHeader name={senderName} icon="🏢" sub="Employee Portal" />
    <h2 style={s.formTitle}>Sign in to your account</h2>
    <p style={s.formSubtitle}>Enter your credentials to continue</p>
    {submitted ? <SubmittedBanner /> : (
      <form onSubmit={onSubmit} style={s.form}>
        <FormField label="Email address"><input style={s.input} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></FormField>
        <FormField label="Password"><input style={s.input} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></FormField>
        <div style={{ textAlign: "right", marginBottom: 8 }}><span style={s.link}>Forgot password?</span></div>
        <button style={s.submitBtn} type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign In"}</button>
      </form>
    )}
    <SecurityNote />
  </div>
);

// ── Fake Verification Page ────────────────────────────────────────────────────

interface VerifyProps {
  senderName: string; code: string; setCode: (v: string) => void;
  submitting: boolean; submitted: boolean; onSubmit: (e: React.FormEvent) => void;
}

const VerificationPage: React.FC<VerifyProps> = ({ senderName, code, setCode, submitting, submitted, onSubmit }) => (
  <div style={s.card}>
    <OrgHeader name={senderName} icon="🔐" sub="Identity Verification" iconBg="#e74c3c" />
    <h2 style={s.formTitle}>Verify Your Identity</h2>
    <p style={s.formSubtitle}>Enter the verification code sent to your registered device.</p>
    {submitted ? <SubmittedBanner /> : (
      <form onSubmit={onSubmit} style={s.form}>
        <FormField label="Verification Code">
          <input style={{ ...s.input, textAlign: "center", letterSpacing: "0.3em", fontSize: 22, fontWeight: 700 }} type="text" placeholder="• • • • • •" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
        </FormField>
        <FormField label="Employee ID"><input style={s.input} type="text" placeholder="EMP-XXXXX" required /></FormField>
        <button style={{ ...s.submitBtn, background: "#e74c3c" }} type="submit" disabled={submitting}>{submitting ? "Verifying…" : "Verify Identity"}</button>
      </form>
    )}
    <SecurityNote />
  </div>
);

// ── Fake Attachment Page ──────────────────────────────────────────────────────

interface AttachProps {
  senderName: string; email: string; password: string;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  submitting: boolean; submitted: boolean; onSubmit: (e: React.FormEvent) => void;
}

const AttachmentPage: React.FC<AttachProps> = ({ senderName, email, password, setEmail, setPassword, submitting, submitted, onSubmit }) => (
  <div style={s.card}>
    <OrgHeader name={senderName} icon="📎" sub="Secure File Access" iconBg="#f39c12" />
    <div style={s.docBox}>
      <div style={{ fontSize: 32 }}>📄</div>
      <div>
        <div style={{ fontWeight: 600, color: "#1c1c1e" }}>Q4_Reimbursement_Report.pdf</div>
        <div style={{ fontSize: 12, color: "#6e6e73" }}>Shared securely • 245 KB</div>
      </div>
    </div>
    <h2 style={{ ...s.formTitle, marginTop: 20 }}>Sign in to access this file</h2>
    <p style={s.formSubtitle}>Authentication required to view this document.</p>
    {submitted ? <SubmittedBanner /> : (
      <form onSubmit={onSubmit} style={s.form}>
        <FormField label="Work Email"><input style={s.input} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></FormField>
        <FormField label="Password"><input style={s.input} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></FormField>
        <button style={{ ...s.submitBtn, background: "#f39c12" }} type="submit" disabled={submitting}>{submitting ? "Accessing…" : "Access File"}</button>
      </form>
    )}
    <SecurityNote />
  </div>
);

// ── Shared helpers ────────────────────────────────────────────────────────────

const OrgHeader: React.FC<{ name: string; icon: string; sub: string; iconBg?: string }> = ({ name, icon, sub, iconBg = "#4f46e5" }) => (
  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, color: "#fff", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#1c1c1e" }}>{name}</div>
      <div style={{ fontSize: 12, color: "#6e6e73" }}>{sub}</div>
    </div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const SubmittedBanner: React.FC = () => (
  <div style={{ background: "#fef3cd", border: "1px solid #ffd700", borderRadius: 6, padding: "14px 16px", textAlign: "center", color: "#92400e", fontWeight: 600, fontSize: 14 }}>
    ⚠️ Processing… Redirecting to security awareness training.
  </div>
);

const SecurityNote: React.FC = () => (
  <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
    <span style={{ fontSize: 12 }}>🔒</span>
    <span style={{ color: "#9ca3af", fontSize: 11 }}>Secured with 256-bit encryption</span>
  </div>
);

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
    {children}
  </div>
);

const s: Record<string, React.CSSProperties> = {
  ribbon: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#1d4ed8", color: "#fff", textAlign: "center", fontSize: 12, fontWeight: 600, padding: "6px", letterSpacing: "0.05em" },
  card: { background: "#fff", borderRadius: 12, padding: "36px 40px", width: "100%", maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", marginTop: 40 },
  formTitle: { color: "#1c1c1e", fontSize: 22, fontWeight: 700, margin: "0 0 6px" },
  formSubtitle: { color: "#6e6e73", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column" },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px 12px", fontSize: 15, color: "#1c1c1e", boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: "#f9fafb" },
  link: { color: "#4f46e5", fontSize: 13, cursor: "pointer" },
  submitBtn: { background: "#4f46e5", color: "#fff", border: "none", padding: "12px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 600, width: "100%", fontFamily: "inherit" },
  docBox: { display: "flex", gap: 14, alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px" },
};

export default PhishingLandingPage;