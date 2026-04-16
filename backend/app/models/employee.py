import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    department = Column(String(255))
    organization = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("admins.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    training_links = relationship(
        "TrainingLink", back_populates="employee",
        cascade="all, delete-orphan"
    )
    progress_records = relationship(
        "TrainingProgress", back_populates="employee"
    )
    quiz_attempts = relationship(
        "QuizAttempt", back_populates="employee"
    )


class TrainingLink(Base):
    __tablename__ = "training_links"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(
        String(64), unique=True, nullable=False, index=True,
        default=lambda: uuid.uuid4().hex
    )
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("training_modules.id"), nullable=False)
    is_used = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("admins.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    employee = relationship("Employee", back_populates="training_links")
    module = relationship("TrainingModule", back_populates="training_links")