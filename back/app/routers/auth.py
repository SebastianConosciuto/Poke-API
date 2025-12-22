from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from app.models.user import UserCreate, UserLogin, Token, User, UserStats
from app.utils.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_user
)
from app.database import supabase
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.services.experience_service import ExperienceService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user/trainer"""
    try:
        # Check if trainer_id already exists
        response = supabase.table("trainers").select("trainer_id").eq("trainer_id", user.trainer_id).execute()
        
        if response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trainer ID already registered"
            )
        
        # Hash the password
        hashed_password = get_password_hash(user.password)
        
        # Insert new user into database
        new_user = {
            "trainer_id": user.trainer_id,
            "password": hashed_password,
            "level": 1,
            "experience": 0
        }
        
        response = supabase.table("trainers").insert(new_user).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        return User(
            trainer_id=user.trainer_id, 
            created_at=response.data[0].get("created_at"),
            level=1,
            experience=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """Login and get access token"""
    try:
        # Get user from database
        response = supabase.table("trainers").select("*").eq("trainer_id", user.trainer_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect trainer ID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        db_user = response.data[0]
        
        # Verify password
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect trainer ID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.trainer_id},
            expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=User)
async def get_me(current_user: str = Depends(get_current_user)):
    """Get current authenticated user information"""
    try:
        response = supabase.table("trainers").select(
            "trainer_id, created_at, level, experience"
        ).eq("trainer_id", current_user).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = response.data[0]
        return User(
            trainer_id=user_data["trainer_id"],
            created_at=user_data.get("created_at"),
            level=user_data.get("level", 1),
            experience=user_data.get("experience", 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user: {str(e)}"
        )

@router.get("/stats", response_model=UserStats)
async def get_stats(current_user: str = Depends(get_current_user)):
    """
    Get comprehensive user statistics
    
    Returns:
    - Trainer level and experience
    - Pokemon captured count
    - Pokedex completion percentage
    - XP needed for next level
    """
    try:
        stats = await ExperienceService.get_trainer_stats(current_user)
        return UserStats(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )