from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TrainingModule(Base):
    __tablename__ = "training_modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    video_url = Column(String(1024))
    video_filename = Column(String(255))
    video_duration_seconds = Column(Integer, default=0)
    thumbnail_url = Column(String(1024))
    is_active = Column(Boolean, default=True)
    pass_threshold = Column(Integer, default=80)
    content_type = Column(String(20), default="video")
    category = Column(String(50), default="mandatory")
    summary = Column(Text)
    created_by = Column(Integer, ForeignKey("admins.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    quiz = relationship("Quiz", back_populates="module", uselist=False, cascade="all, delete-orphan")
    progress_records = relationship("TrainingProgress", back_populates="module", cascade="all, delete-orphan")
    training_links = relationship("TrainingLink", back_populates="module", cascade="all, delete-orphan")