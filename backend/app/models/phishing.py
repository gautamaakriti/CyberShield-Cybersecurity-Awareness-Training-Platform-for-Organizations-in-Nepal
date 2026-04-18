from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class PhishingCampaign(Base):
    __tablename__ = "phishing_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    email_type = Column(String, nullable=False)
    template_type = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    sender_name = Column(String, nullable=False)
    sender_email_display = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message_body = Column(Text, nullable=False)
    cta_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship(
        "PhishingAssignment",
        back_populates="campaign",
        cascade="all, delete-orphan",  # FIX: was missing cascade
    )


class PhishingAssignment(Base):
    __tablename__ = "phishing_assignments"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("phishing_campaigns.id"), nullable=False)
    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),  # FIX: cascade on FK so deleting employee cleans up
        nullable=False,
    )

    is_opened = Column(Boolean, default=False)
    is_clicked = Column(Boolean, default=False)
    is_reported_phishing = Column(Boolean, default=False)
    is_reported_spam = Column(Boolean, default=False)

    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    reported_at = Column(DateTime, nullable=True)

    result_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("PhishingCampaign", back_populates="assignments")
    employee = relationship("Employee", foreign_keys=[employee_id])