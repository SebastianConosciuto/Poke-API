from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    """Schema for user registration"""
    trainer_id: str = Field(..., min_length=3, max_length=50, description="Unique trainer ID")
    password: str = Field(..., min_length=6, description="User password")

class UserLogin(BaseModel):
    """Schema for user login"""
    trainer_id: str
    password: str

class User(BaseModel):
    """Schema for user data"""
    trainer_id: str
    created_at: Optional[datetime] = None

class Token(BaseModel):
    """Schema for JWT token"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Schema for token payload"""
    trainer_id: Optional[str] = None
