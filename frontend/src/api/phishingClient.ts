const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────
// Generic fetch helper
// ─────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.append(k, String(v))
    );
  }

  const adminToken = localStorage.getItem("admin_token") || localStorage.getItem("token");

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `API error ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────
// TypeScript Types
// ─────────────────────────────────────────────

export type CampaignStatus = "draft" | "active" | "completed";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type LandingPageType = "fake_login" | "fake_verification" | "fake_attachment";
export type ResultStatus = "pending" | "safe" | "clicked" | "compromised";

export interface TemplateInfo {
  key: string;
  label: string;
  description: string;
  default_subject: string;
  default_sender_name: string;
  default_cta_text: string;
  difficulty: DifficultyLevel;
}

export interface GenerateTemplateResponse {
  subject: string;
  sender_name: string;
  sender_email_display: string;
  message_body: string;
  cta_text: string;
  landing_page_type: LandingPageType;
  difficulty: DifficultyLevel;
  training_note: string;
}

export interface AssignmentOut {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_email?: string;
  is_opened: boolean;
  is_clicked: boolean;
  is_reported: boolean;
  is_spam_marked: boolean;
  is_credentials_submitted: boolean;
  opened_at?: string;
  clicked_at?: string;
  reported_at?: string;
  spam_marked_at?: string;
  submitted_at?: string;
  result_status: ResultStatus;
  created_at: string;
}

export interface CampaignOut {
  id: number;
  title: string;
  subject: string;
  sender_name: string;
  sender_email_display: string;
  message_body: string;
  cta_text: string;
  landing_page_type: LandingPageType;
  difficulty: DifficultyLevel;
  training_note?: string;
  status: CampaignStatus;
  start_date?: string;
  expiry_date?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  assignments: AssignmentOut[];
}

export interface CampaignListItem {
  id: number;
  title: string;
  subject: string;
  difficulty: DifficultyLevel;
  status: CampaignStatus;
  created_at: string;
  total_assigned: number;
  total_opened: number;
  total_clicked: number;
  total_reported: number;
  total_submitted: number;
}

export interface CampaignCreate {
  title: string;
  subject: string;
  sender_name: string;
  sender_email_display: string;
  message_body: string;
  cta_text: string;
  landing_page_type: LandingPageType;
  difficulty: DifficultyLevel;
  training_note?: string;
  status: CampaignStatus;
  start_date?: string;
  expiry_date?: string;
}

export interface RiskyEmployee {
  employee_id: number;
  name: string;
  email: string;
  campaigns_clicked: number;
  campaigns_submitted: number;
}

export interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_targeted: number;
  total_opened: number;
  total_clicked: number;
  total_reported: number;
  total_submitted: number;
  open_rate: number;
  click_rate: number;
  report_rate: number;
  submit_rate: number;
  risky_employees: RiskyEmployee[];
}

export interface InboxItem {
  assignment_id: number;
  campaign_id: number;
  sender_name: string;
  sender_email_display: string;
  subject: string;
  preview: string;
  difficulty: DifficultyLevel;
  is_opened: boolean;
  is_reported: boolean;
  is_spam_marked: boolean;
  received_at: string;
}

export interface MessageDetail {
  assignment_id: number;
  campaign_id: number;
  sender_name: string;
  sender_email_display: string;
  subject: string;
  message_body: string;
  cta_text: string;
  landing_page_type: LandingPageType;
  difficulty: DifficultyLevel;
  is_opened: boolean;
  is_clicked: boolean;
  is_reported: boolean;
  is_spam_marked: boolean;
  is_credentials_submitted: boolean;
  received_at: string;
}

export interface AwarenessResult {
  assignment_id: number;
  campaign_id: number;
  subject: string;
  difficulty: DifficultyLevel;
  is_opened: boolean;
  is_clicked: boolean;
  is_reported: boolean;
  is_spam_marked: boolean;
  is_credentials_submitted: boolean;
  result_status: ResultStatus;
  training_note?: string;
  red_flags: string[];
  tips: string[];
}

export interface HistoryItem {
  assignment_id: number;
  campaign_id: number;
  subject: string;
  difficulty: DifficultyLevel;
  result_status: ResultStatus;
  is_clicked: boolean;
  is_reported: boolean;
  is_credentials_submitted: boolean;
  completed_at?: string;
  created_at: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface AssignCampaignResponse {
  campaign_id: number;
  results: Array<{
    employee_id: number;
    name: string;
    assigned: boolean;
    already_existed: boolean;
  }>;
}

// ─────────────────────────────────────────────
// Admin API methods
// ─────────────────────────────────────────────

export const phishingAdminApi = {
  getTemplates: () =>
    request<TemplateInfo[]>("/phishing/templates"),

  generateTemplate: (template_key: string, org_name?: string) =>
    request<GenerateTemplateResponse>("/phishing/generate-template", {
      method: "POST",
      body: JSON.stringify({ template_key, org_name }),
    }),

  listCampaigns: () =>
    request<CampaignListItem[]>("/phishing/campaigns"),

  createCampaign: (data: CampaignCreate) =>
    request<CampaignOut>("/phishing/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCampaign: (id: number) =>
    request<CampaignOut>(`/phishing/campaigns/${id}`),

  updateCampaign: (id: number, data: Partial<CampaignCreate>) =>
    request<CampaignOut>(`/phishing/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCampaign: (id: number) =>
    request<ActionResponse>(`/phishing/campaigns/${id}`, { method: "DELETE" }),

  assignEmployees: (campaignId: number, employee_ids: number[]) =>
    request<AssignCampaignResponse>(`/phishing/campaigns/${campaignId}/assign`, {
      method: "POST",
      body: JSON.stringify({ employee_ids }),
    }),

  getDashboard: () =>
    request<DashboardStats>("/phishing/dashboard"),
};

// ─────────────────────────────────────────────
// Employee API methods (token passed as query param)
// ─────────────────────────────────────────────

function getEmpToken(): string {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("employee_token") ||
    localStorage.getItem("access_token") ||
    ""
  );
}

export const phishingEmployeeApi = {
  getInbox: () =>
    request<InboxItem[]>("/phishing/inbox", {}, { token: getEmpToken() }),

  getMessage: (assignmentId: number) =>
    request<MessageDetail>(
      `/phishing/inbox/${assignmentId}`,
      {},
      { token: getEmpToken() }
    ),

  recordClick: (assignmentId: number) =>
    request<ActionResponse>(
      `/phishing/inbox/${assignmentId}/click`,
      { method: "POST" },
      { token: getEmpToken() }
    ),

  reportPhishing: (assignmentId: number) =>
    request<ActionResponse>(
      `/phishing/inbox/${assignmentId}/report`,
      { method: "POST" },
      { token: getEmpToken() }
    ),

  markSpam: (assignmentId: number) =>
    request<ActionResponse>(
      `/phishing/inbox/${assignmentId}/spam`,
      { method: "POST" },
      { token: getEmpToken() }
    ),

  submitCredentials: (assignmentId: number) =>
    request<ActionResponse>(
      `/phishing/inbox/${assignmentId}/submit`,
      { method: "POST" },
      { token: getEmpToken() }
    ),

  getResult: (assignmentId: number) =>
    request<AwarenessResult>(
      `/phishing/inbox/${assignmentId}/result`,
      {},
      { token: getEmpToken() }
    ),

  getHistory: () =>
    request<HistoryItem[]>("/phishing/history", {}, { token: getEmpToken() }),
};