import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { phishingEmployeeApi } from "../../api/phishingClient";
import type { AwarenessResult, ResultStatus } from "../../api/phishingClient";

interface OutcomeCfg {
  title: string;
  subtitle: string;
  emoji: string;
  gradFrom: string;
  gradTo: string;
  border: string;
}

const OUTCOMES: Record<ResultStatus, OutcomeCfg> = {
  compromised: {
    title: "You fell for it 😬",
    subtitle: "You submitted credentials on a fake page. This is a critical risk in a real attack. Don't worry — this was a safe simulation. Let's learn from it.",
    emoji: "🔴",
    gradFrom: "#7f1d1d",
    gradTo: "#991b1b",
    border: "#da3633",
  },
  clicked: {
    title: "You clicked the link ⚠️",
    subtitle: "You clicked the suspicious CTA but stopped before submitting credentials. Good instinct to pause — but clicking alone is still risky.",
    emoji: "🟡",
    gradFrom: "#78350f",
    gradTo: "#92400e",
    border: "#e3b341",
  },
  safe: {
    title: "Excellent work! 🛡️",
    subtitle: "You identified this as suspicious and reported or marked it as spam without clicking. That is exactly the right response!",
    emoji: "🟢",
    gradFrom: "#14532d",
    gradTo: "#166534",
    border: "#3fb950",
  },
  pending: {
    title: "Simulation Complete",
    subtitle: "You opened the email. In a real scenario, always carefully inspect emails before clicking any links.",
    emoji: "⚪",
    gradFrom: "#1e3a5f",
    gradTo: "#1e40af",
    border: "#58a6ff",
  },
};

function diffColor(d: string) {
  return d === "easy" ? "#3fb950" : d === "medium" ? "#e3b341" : "#da3633";
}

const PhishingAwareness: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<AwarenessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    phishingEmployeeApi
      .getResult(Number(assignmentId))
      .then(setResult)
      .catch(() => setError("Could not load your result."))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) {
    return <div style={s.page}><div style={{ color: "#58a6ff", padding: 40 }}>Loading your result…</div></div>;
  }

  if (error || !result) {
    return <div style={s.page}><div style={{ color: "#f85149", padding: 40 }}>{error || "Result not found"}</div></div>;
  }

  const outcome = OUTCOMES[result.result_status];

  return (
    <div style={s.page}>
      <div style={{ ...s.hero, background: `linear-gradient(135deg, ${outcome.gradFrom}, ${outcome.gradTo})`, borderBottom: `3px solid ${outcome.border}` }}>
        <div style={s.heroEmoji}>{outcome.emoji}</div>
        <div>
          <h1 style={s.heroTitle}>{outcome.title}</h1>
          <p style={s.heroSubtitle}>{outcome.subtitle}</p>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>📧 Simulation Details</h3>
          <div style={s.infoGrid}>
            <InfoRow label="Email Subject" value={result.subject} />
            <InfoRow label="Difficulty" value={result.difficulty.toUpperCase()} color={diffColor(result.difficulty)} />
            <InfoRow label="Opened" value={result.is_opened ? "Yes" : "No"} />
            <InfoRow label="Clicked CTA" value={result.is_clicked ? "Yes ⚠️" : "No ✓"} color={result.is_clicked ? "#e3b341" : "#3fb950"} />
            <InfoRow label="Reported Phishing" value={result.is_reported ? "Yes ✓" : "No"} color={result.is_reported ? "#3fb950" : "#8b949e"} />
            <InfoRow label="Marked as Spam" value={result.is_spam_marked ? "Yes ✓" : "No"} color={result.is_spam_marked ? "#3fb950" : "#8b949e"} />
            <InfoRow label="Credentials Submitted" value={result.is_credentials_submitted ? "Yes 🔴" : "No ✓"} color={result.is_credentials_submitted ? "#da3633" : "#3fb950"} />
            <InfoRow label="Final Result" value={result.result_status.toUpperCase()} color={outcome.border} />
          </div>
        </div>

        <div style={s.twoCol}>
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, color: "#da3633" }}>🚩 Red Flags You May Have Missed</h3>
            <ul style={s.list}>
              {result.red_flags.map((flag, i) => (
                <li key={i} style={s.listItem}><span style={{ color: "#e3b341", flexShrink: 0 }}>⚠️</span><span>{flag}</span></li>
              ))}
            </ul>
          </div>
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, color: "#3fb950" }}>💡 Security Tips</h3>
            <ul style={s.list}>
              {result.tips.map((tip, i) => (
                <li key={i} style={s.listItem}><span style={{ color: "#3fb950", flexShrink: 0 }}>✓</span><span>{tip}</span></li>
              ))}
            </ul>
          </div>
        </div>

        {result.training_note && (
          <div style={s.trainingNote}>
            <div style={s.trainingHeader}><span>📚</span><span>Trainer's Note</span></div>
            <p style={s.trainingText}>{result.training_note}</p>
          </div>
        )}

        <div style={s.safetyBanner}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, color: "#3fb950", marginBottom: 4 }}>This was a completely safe simulation</div>
            <div style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.6 }}>
              No real credentials were captured or stored at any point. This exercise is part of CyberShield's cybersecurity awareness program.
            </div>
          </div>
        </div>

        <div style={s.actions}>
          <button style={s.primaryBtn} onClick={() => navigate("/employee/phishing/inbox")}>← Back to Inbox</button>
          <button style={s.secondaryBtn} onClick={() => navigate("/employee/training")}>📚 View Training Modules</button>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <>
    <div style={{ color: "#8b949e", fontSize: 13 }}>{label}</div>
    <div style={{ color: color || "#e6edf3", fontWeight: 600, fontSize: 14 }}>{value}</div>
  </>
);

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d1117", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  hero: { display: "flex", alignItems: "flex-start", gap: 20, padding: "36px 40px" },
  heroEmoji: { fontSize: 48, flexShrink: 0 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px" },
  heroSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 15, margin: 0, lineHeight: 1.6, maxWidth: 680 },
  body: { maxWidth: 900, margin: "0 auto", padding: "28px 40px" },
  card: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "20px 24px", marginBottom: 16 },
  cardTitle: { color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 14px" },
  infoGrid: { display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px 20px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  listItem: { display: "flex", gap: 10, alignItems: "flex-start", color: "#c9d1d9", fontSize: 14, lineHeight: 1.5 },
  trainingNote: { background: "#1d4ed822", border: "1px solid #1d4ed844", borderRadius: 8, padding: "18px 24px", marginBottom: 16 },
  trainingHeader: { display: "flex", alignItems: "center", gap: 8, color: "#58a6ff", fontWeight: 700, fontSize: 15, marginBottom: 10 },
  trainingText: { color: "#c9d1d9", fontSize: 14, lineHeight: 1.7, margin: 0 },
  safetyBanner: { background: "#23863622", border: "1px solid #23863644", borderRadius: 8, padding: "16px 22px", display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 },
  actions: { display: "flex", gap: 12, flexWrap: "wrap" },
  primaryBtn: { background: "#238636", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
  secondaryBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "10px 22px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "inherit" },
};

export default PhishingAwareness;