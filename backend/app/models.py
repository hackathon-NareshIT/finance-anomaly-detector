from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class Transaction(BaseModel):
    id: int
    date: str
    merchant: str
    category: str
    amount: float
    anomaly_score: float
    is_anomaly: bool
    reason: Optional[str] = None


class ScanResult(BaseModel):
    total_transactions: int
    anomaly_count: int
    total_spent: float
    avg_transaction: float
    category_breakdown: dict
    transactions: List[Transaction]


class ScanHistoryItem(BaseModel):
    id: str
    filename: str
    total_transactions: int
    anomaly_count: int
    created_at: datetime
    results: Any
