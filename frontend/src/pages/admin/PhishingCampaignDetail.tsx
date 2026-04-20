import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { phishingAdminApi } from "../../api/phishingClient";
import type { CampaignOut, ResultStatus } from "../../api/phishingClient";

const RESULT_COLOR: Record<ResultStatus, string> = {
  pending: "#8b949e",
  safe: "#3fb950",
  clicked: "#e3b341",
  compromised: "#da3633",
};

const RESULT_ICON: Record<ResultStatus, string> = {
  pending: "⏳",
  safe: "🛡️",
  clicked: "⚠️",
  compromised: "🔴",
};

const PhishingCampaignDetail: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "preview">("results");

  const [assignIds, setAssignIds] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  useEffect(() => {
    if (!campaignId) return;
    phishingAdminApi
      .getCampaign(Number(campaignId))
      .then(setCampaign)
      .catch(() => setError("Campaign not found"))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign) return;
    const updated = await phishingAdminApi.updateCampaign(campaign.id, {
      status: newStatus as any,
    });
    setCampaign(updated);
  };

  const handleAssign = async () => {
    if (!campaign) return;
    const ids = assignIds
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (ids.length === 0) {
      setAssignMsg("Please enter valid employee IDs");
      return;
    }
    setAssigning(true);
    setAssignMsg("");
    try {
      const resp = await phishingAdminApi.assignEmployees(campaign.id, ids);
      const done = resp.results.filter((r) => r.assigned).length;
      const dupe = resp.results.filter((r) => r.already_existed).length;
      setAssignMsg(
        `✅ Assigned ${done} employee(s). ${dupe > 0 ? `${dupe} already assigned.` : ""}`
      );
      setAssignIds("");
      const updated = await phishingAdminApi.getCampaign(campaign.id);
      setCampaign(updated);
    } catch (e: any) {
      setAssignMsg(`❌ ${e.message}`);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={{ color: "#58a6ff" }}>Loading…</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div style={s.page}>
        <div style={{ color: "#f85149" }}>{error || "Not found"}</div>
      </div>
    );
  }

  const a = campaign.assignments;
  const total = a.length;
  const opened = a.filter((x) => x.is_opened).length;
  const clicked = a.filter((x) => x.is_clicked).length;
  const reported = a.filter((x) => x.is_reported).length;
  const submitted = a.filter((x) => x.is_credentials_submitted).length;
  const rate = (n: number) =>
    total > 0 ? ((n / total) * 100).toFixed(1) + "%" : "0%";

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate("/admin/phishing")}>
          ← Campaigns
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={s.title}>{campaign.title}</h1>
          <p style={{ color: "#8b949e", margin: "4px 0 0", fontSize: 13 }}>
            {campaign.subject}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["draft", "active", "completed"] as const).map((st) => (
            <button
              key={st}
              style={{
                ...s.statusBtn,
                ...(campaign.status === st
                  ? { background: "#58a6ff22", color: "#58a6ff", borderColor: "#58a6ff44" }
                  : {}),
              }}
              onClick={() => handleStatusChange(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={s.statsRow}>
        {[
          { label: "Assigned", value: total, color: "#e6edf3", icon: "👥" },
          { label: "Opened", value: `${opened} (${rate(opened)})`, color: "#58a6ff", icon: "📬" },
          { label: "Clicked", value: `${clicked} (${rate(clicked)})`, color: "#e3b341", icon: "⚠️" },
          { label: "Reported", value: `${reported} (${rate(reported)})`, color: "#3fb950", icon: "🛡️" },
          { label: "Submitted", value: `${submitted} (${rate(submitted)})`, color: "#da3633", icon: "🔴" },
        ].map((st) => (
          <div key={st.label} style={s.statCard}>
            <div style={{ fontSize: 20 }}>{st.icon}</div>
            <div style={{ color: st.color, fontWeight: 700, fontSize: 20, marginTop: 4 }}>
              {st.value}
            </div>
            <div style={{ color: "#8b949e", fontSize: 11 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        {(["results", "preview"] as const).map((tab) => (
          <button
            key={tab}
            style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "results" ? "Employee Results" : "Email Preview"}
          </button>
        ))}
      </div>

      {/* Results Tab */}
      {activeTab === "results" && (
        <>
          <div style={s.assignBox}>
            <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 10 }}>
              Assign Employees to this Campaign
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                style={{ ...s.input, flex: 1 }}
                placeholder="Employee IDs separated by comma: 1, 2, 5, 8"
                value={assignIds}
                onChange={(e) => setAssignIds(e.target.value)}
              />
              <button style={s.assignBtn} onClick={handleAssign} disabled={assigning}>
                {assigning ? "Assigning…" : "Assign"}
              </button>
            </div>
            {assignMsg && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#8b949e" }}>
                {assignMsg}
              </div>
            )}
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={{ background: "#0d1117" }}>
                  {["Employee", "Opened", "Clicked", "Reported", "Spam", "Submitted", "Result", "Opened At"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#8b949e", fontSize: 14 }}>
                      No employees assigned. Use the form above to assign employees.
                    </td>
                  </tr>
                )}
                {a.map((row) => (
                  <tr key={row.id} style={{ borderTop: "1px solid #21262d" }}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: "#e6edf3" }}>
                        {row.employee_name || `Employee #${row.employee_id}`}
                      </div>
                      <div style={{ fontSize: 12, color: "#8b949e" }}>{row.employee_email || ""}</div>
                    </td>
                    <td style={s.td}><BoolCell v={row.is_opened} /></td>
                    <td style={s.td}><BoolCell v={row.is_clicked} warn /></td>
                    <td style={s.td}><BoolCell v={row.is_reported} good /></td>
                    <td style={s.td}><BoolCell v={row.is_spam_marked} good /></td>
                    <td style={s.td}><BoolCell v={row.is_credentials_submitted} warn /></td>
                    <td style={s.td}>
                      <span style={{ color: RESULT_COLOR[row.result_status], fontWeight: 600 }}>
                        {RESULT_ICON[row.result_status]} {row.result_status}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: "#8b949e" }}>
                      {row.opened_at ? new Date(row.opened_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Preview Tab */}
      {activeTab === "preview" && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <div style={s.emailCard}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={s.senderAvatar}>
                {(campaign.sender_name[0] || "?").toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1c1c1e" }}>{campaign.sender_name}</div>
                <div style={{ color: "#6e6e73", fontSize: 13 }}>&lt;{campaign.sender_email_display}&gt;</div>
              </div>
            </div>
            <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16, fontWeight: 700, fontSize: 18, color: "#1c1c1e" }}>
              {campaign.subject}
            </div>
            <div
              style={{ color: "#374151", lineHeight: 1.7, fontSize: 15 }}
              dangerouslySetInnerHTML={{ __html: campaign.message_body }}
            />
            <div style={{ marginTop: 24 }}>
              <button style={s.ctaPreviewBtn}>{campaign.cta_text}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BoolCell: React.FC<{ v: boolean; warn?: boolean; good?: boolean }> = ({ v, warn, good }) => {
  if (!v) return <span style={{ color: "#8b949e" }}>—</span>;
  const color = good ? "#3fb950" : warn ? "#da3633" : "#58a6ff";
  return <span style={{ color, fontWeight: 700 }}>✓</span>;
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d1117", padding: "32px 40px", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 },
  backBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit", flexShrink: 0 },
  title: { color: "#e6edf3", fontSize: 22, fontWeight: 700, margin: 0 },
  statusBtn: { background: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, textTransform: "capitalize", fontFamily: "inherit" },
  statsRow: { display: "flex", gap: 14, marginBottom: 22 },
  statCard: { flex: 1, background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "14px", textAlign: "center" },
  tabBar: { display: "flex", borderBottom: "1px solid #30363d", marginBottom: 20 },
  tab: { background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#8b949e", padding: "10px 20px", cursor: "pointer", fontSize: 14, fontFamily: "inherit", marginBottom: -1 },
  tabActive: { color: "#58a6ff", borderBottomColor: "#58a6ff" },
  assignBox: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "16px 20px", marginBottom: 18 },
  input: { background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", padding: "8px 12px", fontSize: 14, fontFamily: "inherit", outline: "none" },
  assignBtn: { background: "#238636", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
  tableWrap: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", textAlign: "left", color: "#8b949e", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" },
  td: { padding: "12px 14px", color: "#c9d1d9", fontSize: 14, verticalAlign: "middle" },
  emailCard: { background: "#fff", borderRadius: 8, padding: "28px 32px", maxWidth: 620, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" },
  senderAvatar: { width: 40, height: 40, borderRadius: "50%", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" },
  ctaPreviewBtn: { background: "#4f46e5", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 600 },
};

export default PhishingCampaignDetail;