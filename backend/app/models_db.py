import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email        = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role         = Column(String(50), default="user", nullable=False)  
    created_at   = Column(DateTime, default=datetime.utcnow)

    scans = relationship("ScanHistory", back_populates="user", cascade="all, delete-orphan")


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename            = Column(String(255))
    total_transactions  = Column(Integer)
    anomaly_count       = Column(Integer)
    results             = Column(JSONB)       
    created_at          = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scans")
