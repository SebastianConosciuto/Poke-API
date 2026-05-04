"""
Authentication router — register, login, get current user, get stats.

All business logic lives in services; this file is the HTTP layer only.
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.constants import Table
from app.core.errors import handle_route_errors
from app.database import supabase
from app.models.user import Token, User, UserCreate, UserLogin, UserStats
from app.services.experience_service import ExperienceService
from app.utils.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
@handle_route_errors("Registration failed")
async def register(user: UserCreate):
    """Create a new trainer."""
    existing = (
        supabase.table(Table.TRAINERS)
        .select("trainer_id")
        .eq("trainer_id", user.trainer_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer ID already registered",
        )

    response = (
        supabase.table(Table.TRAINERS)
        .insert(
            {
                "trainer_id": user.trainer_id,
                "password": get_password_hash(user.password),
                "level": 1,
                "experience": 0,
            }
        )
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    return User(
        trainer_id=user.trainer_id,
        created_at=response.data[0].get("created_at"),
        level=1,
        experience=0,
    )


@router.post("/login", response_model=Token)
@handle_route_errors("Login failed")
async def login(user: UserLogin):
    """Verify credentials and return a JWT access token."""
    response = (
        supabase.table(Table.TRAINERS)
        .select("*")
        .eq("trainer_id", user.trainer_id)
        .execute()
    )
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect trainer ID or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not response.data:
        raise invalid_credentials
    db_user = response.data[0]
    if not verify_password(user.password, db_user["password"]):
        raise invalid_credentials

    access_token = create_access_token(
        data={"sub": user.trainer_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=User)
@handle_route_errors("Failed to get user")
async def get_me(current_user: str = Depends(get_current_user)):
    """Return the row for the current trainer."""
    response = (
        supabase.table(Table.TRAINERS)
        .select("trainer_id, created_at, level, experience")
        .eq("trainer_id", current_user)
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user_data = response.data[0]
    return User(
        trainer_id=user_data["trainer_id"],
        created_at=user_data.get("created_at"),
        level=user_data.get("level", 1),
        experience=user_data.get("experience", 0),
    )


@router.get("/stats", response_model=UserStats)
@handle_route_errors("Failed to get stats")
async def get_stats(current_user: str = Depends(get_current_user)):
    """Aggregated dashboard stats: level, XP, capture count, completion %."""
    stats = await ExperienceService.get_trainer_stats(current_user)
    return UserStats(**stats)
