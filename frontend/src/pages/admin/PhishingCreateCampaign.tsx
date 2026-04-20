import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { phishingAdminApi } from "../../api/phishingClient";
import type {
  CampaignCreate,
  TemplateInfo,
  GenerateTemplateResponse,
  LandingPageType,
} from "../../api/phishingClient";

const LANDING_OPTIONS: { value: LandingPageType; label: string }[] = [
  { value: "fake_login", label: "Fake Login Page" },
  { value: "fake_verification", label: "Fake Verification Page" },
  { value: "fake_attachment", label: "Fake Attachment Page" },
];

const defaultForm = (): CampaignCreate => ({
  title: "",
  subject: "",
  sender_name: "",
  sender_email_display: "",
  message_body: "",
  cta_text: "Click Here",
  landing_page_type: "fake_login",
  difficulty: "medium",
  training_note: "",
  status: "draft",
});

function diffColor(d: string) {
  return d === "easy" ? "#3fb950" : d === "medium" ? "#e3b341" : "#da3633";
}

const PhishingCreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CampaignCreate>(defaultForm());
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [orgName, setOrgName] = useState("CyberShield Corp");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    phishingAdminApi.getTemplates().then(setTemplates).catch(() => {});
  }, []);

  const loadTemplate = async (key: string) => {
    if (!key) return;
    setLoadingTemplate(true);
    try {
      const t: GenerateTemplateResponse = await phishingAdminApi.generateTemplate(key, orgName);
      setForm((prev) => ({
        ...prev,
        subject: t.subject,
        sender_name: t.sender_name,
        sender_email_display: t.sender_email_display,
        message_body: t.message_body,
        cta_text: t.cta_text,
        landing_page_type: t.landing_page_type,
        difficulty: t.difficulty,
        training_note: t.training_note,
      }));
      setSelectedKey(key);
    } catch {
      setError("Failed to load template");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.subject || !form.message_body) {
      setError("Title, subject, and message body are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await phishingAdminApi.createCampaign(form);
      navigate(`/admin/phishing/${created.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate("/admin/phishing")}>← Back</button>
        <h1 style={s.title}>Create Phishing Campaign</h1>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.layout}>
        {/* Template Picker */}
        <aside style={s.templatePanel}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📌 Quick Templates</h3>
            <label style={s.label}>Organisation Name</label>
            <input style={s.input} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your company name" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {templates.map((t) => (
                <button
                  key={t.key}
                  style={{ ...s.templateBtn, ...(selectedKey === t.key ? s.templateBtnActive : {}) }}
                  onClick={() => loadTemplate(t.key)}
                  disabled={loadingTemplate}
                >
                  <div style={{ fontWeight: 600, color: "#e6edf3", marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#8b949e", lineHeight: 1.4 }}>{t.description}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, marginTop: 6, display: "inline-block", background: diffColor(t.difficulty) + "22", color: diffColor(t.difficulty), border: `1px solid ${diffColor(t.difficulty)}44`, textTransform: "capitalize" }}>
                    {t.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Campaign Form */}
        <div style={{ flex: 1 }}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Campaign Details</h3>

            <Field label="Campaign Title *">
              <input style={s.input} name="title" value={form.title} onChange={handleChange} placeholder="e.g. Q1 IT Alert Simulation" />
            </Field>

            <div style={s.row2}>
              <Field label="Status">
                <select style={s.input} name="status" value={form.status} onChange={handleChange}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
              <Field label="Difficulty">
                <select style={s.input} name="difficulty" value={form.difficulty} onChange={handleChange}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
            </div>

            <Field label="Email Subject *">
              <input style={s.input} name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Urgent: Your account will be locked" />
            </Field>

            <div style={s.row2}>
              <Field label="Sender Display Name">
                <input style={s.input} name="sender_name" value={form.sender_name} onChange={handleChange} placeholder="IT Security Team" />
              </Field>
              <Field label="Sender Display Email">
                <input style={s.input} name="sender_email_display" value={form.sender_email_display} onChange={handleChange} placeholder="it-security@company-support.com" />
              </Field>
            </div>

            <Field label="Message Body (HTML supported) *">
              <textarea
                style={{ ...s.input, minHeight: 180, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                name="message_body"
                value={form.message_body}
                onChange={handleChange}
                placeholder="<p>Dear Employee,</p><p>Your password will expire...</p>"
              />
            </Field>

            <div style={s.row2}>
              <Field label="CTA Button Text">
                <input style={s.input} name="cta_text" value={form.cta_text} onChange={handleChange} placeholder="Reset My Password Now" />
              </Field>
              <Field label="Landing Page Type">
                <select style={s.input} name="landing_page_type" value={form.landing_page_type} onChange={handleChange}>
                  {LANDING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Training Note (shown to employee after simulation)">
              <textarea
                style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                name="training_note"
                value={form.training_note || ""}
                onChange={handleChange}
                placeholder="Explain what red flags employees should have noticed..."
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button style={s.cancelBtn} onClick={() => navigate("/admin/phishing")}>Cancel</button>
            <button style={s.submitBtn} onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating…" : "Create Campaign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: "#8b949e", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </label>
    {children}
  </div>
);

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d1117", padding: "32px 40px", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24 },
  backBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  title: { color: "#e6edf3", fontSize: 22, fontWeight: 700, margin: 0 },
  errorBox: { background: "#da363322", border: "1px solid #da363344", color: "#f85149", padding: "12px 16px", borderRadius: 6, marginBottom: 20, fontSize: 14 },
  layout: { display: "flex", gap: 24, alignItems: "flex-start" },
  templatePanel: { width: 270, flexShrink: 0 },
  card: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: 22, marginBottom: 16 },
  cardTitle: { color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 14px" },
  label: { display: "block", color: "#8b949e", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", padding: "8px 12px", fontSize: 14, fontFamily: "'Segoe UI', system-ui, sans-serif", boxSizing: "border-box", outline: "none" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  templateBtn: { background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, padding: "10px 12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s", width: "100%" },
  templateBtnActive: { borderColor: "#58a6ff", background: "#58a6ff11" },
  submitBtn: { background: "#238636", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
  cancelBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "inherit" },
};

export default PhishingCreateCampaign;