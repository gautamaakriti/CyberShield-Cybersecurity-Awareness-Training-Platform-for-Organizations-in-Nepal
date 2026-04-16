from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TrainingProgress(Base):
    __tablename__ = "training_progress"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("training_modules.id"), nullable=False)
    status = Column(String(50), default="not_started")
    video_watched = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    best_score = Column(Integer, default=0)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    employee = relationship("Employee", back_populates="progress_records")
    module = relationship("TrainingModule", back_populates="progress_records")
    quiz_attempts = relationship("QuizAttempt", back_populates="progress")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    progress_id = Column(Integer, ForeignKey("training_progress.id"))
    score = Column(Integer, default=0)
    passed = Column(Boolean, default=False)
    answers = Column(JSON)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    employee = relationship("Employee", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    progress = relationship("TrainingProgress", back_populates="quiz_attempts")
