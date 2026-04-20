import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { phishingAdminApi } from "../../api/phishingClient";
import type { CampaignListItem, DashboardStats } from "../../api/phishingClient";

const DIFF_COLOR: Record<string, string> = {
  easy: "#3fb950",
  medium: "#e3b341",
  hard: "#da3633",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "#58a6ff",
  active: "#3fb950",
  completed: "#8b949e",
};

const PhishingCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      phishingAdminApi.listCampaigns(),
      phishingAdminApi.getDashboard(),
    ])
      .then(([c, s]) => {
        setCampaigns(c);
        setStats(s);
      })
      .catch(() => setError("Failed to load campaigns. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this campaign permanently?")) return;
    await phishingAdminApi.deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loading}>Loading campaigns…</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🎣 Phishing Simulation</h1>
          <p style={s.subtitle}>Create phishing campaigns, assign employees, and track results</p>
        </div>
        <button style={s.createBtn} onClick={() => navigate("/admin/phishing/create")}>
          + New Campaign
        </button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {stats && (
        <div style={s.statsGrid}>
          {[
            { label: "Total Campaigns", value: stats.total_campaigns, icon: "📋", color: "#e6edf3" },
            { label: "Active", value: stats.active_campaigns, icon: "🟢", color: "#3fb950" },
            { label: "Total Targeted", value: stats.total_targeted, icon: "👥", color: "#e6edf3" },
            { label: "Opened", value: `${stats.total_opened} (${stats.open_rate}%)`, icon: "📬", color: "#58a6ff" },
            { label: "Clicked", value: `${stats.total_clicked} (${stats.click_rate}%)`, icon: "⚠️", color: "#e3b341" },
            { label: "Reported", value: `${stats.total_reported} (${stats.report_rate}%)`, icon: "🛡️", color: "#3fb950" },
            { label: "Submitted", value: `${stats.total_submitted} (${stats.submit_rate}%)`, icon: "🔴", color: "#da3633" },
          ].map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div style={{ color: stat.color, fontWeight: 700, fontSize: 20, marginTop: 4 }}>{stat.value}</div>
              <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.theadRow}>
              <th style={s.th}>Campaign</th>
              <th style={s.th}>Difficulty</th>
              <th style={s.th}>Status</th>
              <th style={{ ...s.th, textAlign: "center" }}>Assigned</th>
              <th style={{ ...s.th, textAlign: "center" }}>Opened</th>
              <th style={{ ...s.th, textAlign: "center" }}>Clicked</th>
              <th style={{ ...s.th, textAlign: "center" }}>Submitted</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                  No campaigns yet. Click <strong>+ New Campaign</strong> to create one.
                </td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} style={s.tbodyRow} onClick={() => navigate(`/admin/phishing/${c.id}`)}>
                <td style={s.td}>
                  <div style={{ fontWeight: 600, color: "#e6edf3" }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>
                    {c.subject.length > 55 ? c.subject.slice(0, 55) + "…" : c.subject}
                  </div>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: DIFF_COLOR[c.difficulty] + "22", color: DIFF_COLOR[c.difficulty], border: `1px solid ${DIFF_COLOR[c.difficulty]}44` }}>
                    {c.difficulty}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: STATUS_COLOR[c.status] + "22", color: STATUS_COLOR[c.status], border: `1px solid ${STATUS_COLOR[c.status]}44` }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ ...s.td, textAlign: "center" }}>{c.total_assigned}</td>
                <td style={{ ...s.td, textAlign: "center", color: "#58a6ff" }}>{c.total_opened}</td>
                <td style={{ ...s.td, textAlign: "center", color: "#e3b341" }}>{c.total_clicked}</td>
                <td style={{ ...s.td, textAlign: "center", color: "#da3633" }}>{c.total_submitted}</td>
                <td style={s.td}>
                  <button style={s.viewBtn} onClick={(e) => { e.stopPropagation(); navigate(`/admin/phishing/${c.id}`); }}>View</button>
                  <button style={s.deleteBtn} onClick={(e) => handleDelete(c.id, e)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats && stats.risky_employees.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={s.sectionTitle}>⚠️ High-Risk Employees</h2>
          <div style={s.riskyGrid}>
            {stats.risky_employees.slice(0, 6).map((emp) => (
              <div key={emp.employee_id} style={s.riskyCard}>
                <div style={s.riskyAvatar}>{(emp.name[0] || "?").toUpperCase()}</div>
                <div>
                  <div style={{ color: "#e6edf3", fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>{emp.email}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {emp.campaigns_clicked > 0 && (
                      <span style={{ ...s.badge, background: "#e3b34122", color: "#e3b341", border: "1px solid #e3b34144" }}>{emp.campaigns_clicked} clicked</span>
                    )}
                    {emp.campaigns_submitted > 0 && (
                      <span style={{ ...s.badge, background: "#da363322", color: "#da3633", border: "1px solid #da363344" }}>{emp.campaigns_submitted} submitted</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d1117", padding: "32px 40px", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  loading: { color: "#58a6ff", fontSize: 16, padding: "40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  title: { color: "#e6edf3", fontSize: 26, fontWeight: 700, margin: 0 },
  subtitle: { color: "#8b949e", fontSize: 14, marginTop: 4 },
  createBtn: { background: "#238636", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
  errorBox: { background: "#da363322", border: "1px solid #da363344", color: "#f85149", padding: "12px 16px", borderRadius: 6, marginBottom: 20, fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14, marginBottom: 28 },
  statCard: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "16px 12px", textAlign: "center" },
  tableWrap: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  theadRow: { background: "#0d1117" },
  th: { padding: "11px 16px", textAlign: "left", color: "#8b949e", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
  tbodyRow: { borderTop: "1px solid #21262d", cursor: "pointer", transition: "background 0.1s" },
  td: { padding: "13px 16px", color: "#c9d1d9", fontSize: 14, verticalAlign: "middle" },
  badge: { fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 12, textTransform: "capitalize", display: "inline-block" },
  viewBtn: { background: "transparent", border: "1px solid #30363d", color: "#58a6ff", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginRight: 6 },
  deleteBtn: { background: "transparent", border: "1px solid #da363344", color: "#da3633", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  sectionTitle: { color: "#e6edf3", fontSize: 18, fontWeight: 700, marginBottom: 14 },
  riskyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 12 },
  riskyCard: { background: "#161b22", border: "1px solid #da363344", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" },
  riskyAvatar: { width: 38, height: 38, borderRadius: "50%", background: "#da363322", border: "1px solid #da363344", color: "#da3633", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};

export default PhishingCampaigns;