from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.phishing import (
    CampaignStatus,
    DifficultyLevel,
    LandingPageType,
    ResultStatus,
    EventType,
)


# ─────────────────────────────────────────────
# Template schemas
# ─────────────────────────────────────────────

class TemplateInfo(BaseModel):
    key: str
    label: str
    description: str
    default_subject: str
    default_sender_name: str
    default_cta_text: str
    difficulty: DifficultyLevel


class GenerateTemplateRequest(BaseModel):
    template_key: str
    org_name: Optional[str] = "CyberShield Corp"


class GenerateTemplateResponse(BaseModel):
    subject: str
    sender_name: str
    sender_email_display: str
    message_body: str
    cta_text: str
    landing_page_type: LandingPageType
    difficulty: DifficultyLevel
    training_note: str


# ─────────────────────────────────────────────
# Campaign schemas
# ─────────────────────────────────────────────

class CampaignCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=500)
    sender_name: str = Field(..., min_length=1, max_length=255)
    sender_email_display: str = Field(..., min_length=1, max_length=255)
    message_body: str = Field(..., min_length=1)
    cta_text: str = Field(default="Click Here", max_length=255)
    landing_page_type: LandingPageType = LandingPageType.fake_login
    difficulty: DifficultyLevel = DifficultyLevel.medium
    training_note: Optional[str] = None
    status: CampaignStatus = CampaignStatus.draft
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email_display: Optional[str] = None
    message_body: Optional[str] = None
    cta_text: Optional[str] = None
    landing_page_type: Optional[LandingPageType] = None
    difficulty: Optional[DifficultyLevel] = None
    training_note: Optional[str] = None
    status: Optional[CampaignStatus] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None


class EmployeeAssignResult(BaseModel):
    employee_id: int
    name: str
    assigned: bool
    already_existed: bool


class AssignCampaignRequest(BaseModel):
    employee_ids: List[int]


class AssignCampaignResponse(BaseModel):
    campaign_id: int
    results: List[EmployeeAssignResult]


class AssignmentOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    is_opened: bool
    is_clicked: bool
    is_reported: bool
    is_spam_marked: bool
    is_credentials_submitted: bool
    opened_at: Optional[datetime]
    clicked_at: Optional[datetime]
    reported_at: Optional[datetime]
    spam_marked_at: Optional[datetime]
    submitted_at: Optional[datetime]
    result_status: ResultStatus
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignOut(BaseModel):
    id: int
    title: str
    subject: str
    sender_name: str
    sender_email_display: str
    message_body: str
    cta_text: str
    landing_page_type: LandingPageType
    difficulty: DifficultyLevel
    training_note: Optional[str]
    status: CampaignStatus
    start_date: Optional[datetime]
    expiry_date: Optional[datetime]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    assignments: List[AssignmentOut] = []

    class Config:
        from_attributes = True


class CampaignListItem(BaseModel):
    id: int
    title: str
    subject: str
    difficulty: DifficultyLevel
    status: CampaignStatus
    created_at: datetime
    total_assigned: int
    total_opened: int
    total_clicked: int
    total_reported: int
    total_submitted: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────

class RiskyEmployee(BaseModel):
    employee_id: int
    name: str
    email: str
    campaigns_clicked: int
    campaigns_submitted: int


class DashboardStats(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_targeted: int
    total_opened: int
    total_clicked: int
    total_reported: int
    total_submitted: int
    open_rate: float
    click_rate: float
    report_rate: float
    submit_rate: float
    risky_employees: List[RiskyEmployee]


# ─────────────────────────────────────────────
# Employee inbox schemas
# ─────────────────────────────────────────────

class InboxItem(BaseModel):
    assignment_id: int
    campaign_id: int
    sender_name: str
    sender_email_display: str
    subject: str
    preview: str
    difficulty: DifficultyLevel
    is_opened: bool
    is_reported: bool
    is_spam_marked: bool
    received_at: datetime


class MessageDetail(BaseModel):
    assignment_id: int
    campaign_id: int
    sender_name: str
    sender_email_display: str
    subject: str
    message_body: str
    cta_text: str
    landing_page_type: LandingPageType
    difficulty: DifficultyLevel
    is_opened: bool
    is_clicked: bool
    is_reported: bool
    is_spam_marked: bool
    is_credentials_submitted: bool
    received_at: datetime


class AwarenessResult(BaseModel):
    assignment_id: int
    campaign_id: int
    subject: str
    difficulty: DifficultyLevel
    is_opened: bool
    is_clicked: bool
    is_reported: bool
    is_spam_marked: bool
    is_credentials_submitted: bool
    result_status: ResultStatus
    training_note: Optional[str]
    red_flags: List[str]
    tips: List[str]


class HistoryItem(BaseModel):
    assignment_id: int
    campaign_id: int
    subject: str
    difficulty: DifficultyLevel
    result_status: ResultStatus
    is_clicked: bool
    is_reported: bool
    is_credentials_submitted: bool
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Generic response
# ─────────────────────────────────────────────

class ActionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None