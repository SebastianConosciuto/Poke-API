"""
Models for Pokemon catching minigame.

Stats ranges per tier are defined in app.core.difficulty.DIFFICULTY_TIERS —
this file only carries the labels.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty tier identifiers; ranges live in app.core.difficulty."""
    WEAK = "weak"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    LEGENDARY = "legendary"
    MYTHICAL = "mythical"


class CatchRequest(BaseModel):
    """Request to start a catch attempt."""
    # Default region/habitat to "any" so a partially-built request from the
    # client (e.g. before the user picks options) doesn't 422 the user
    # straight to the error snackbar — the catch service's `is_any` helper
    # treats "any" as no filter.
    region: str = Field(default="any", description="Pokemon region or 'any'")
    habitat: str = Field(default="any", description="Pokemon habitat or 'any'")
    # Default difficulty so the form is forgiving if the local state ever
    # falls out of sync with the available-difficulties list returned by the
    # /catch/difficulties endpoint (see frontend snap-back logic).
    difficulty: DifficultyLevel = Field(
        default=DifficultyLevel.MEDIUM,
        description="Difficulty tier; defaults to medium if missing",
    )


class ButtonSequence(BaseModel):
    """QTE button sequence"""
    buttons: List[str] = Field(..., description="List of arrow keys: up, down, left, right")
    time_per_button: float = Field(..., description="Time allowed per button in seconds")
    total_buttons: int = Field(..., description="Total number of buttons in sequence")


class CatchChallenge(BaseModel):
    """Response with Pokemon and QTE challenge"""
    pokemon_id: int
    pokemon_name: str
    pokemon_sprite: str
    stats_total: int
    sequence: ButtonSequence
    difficulty: DifficultyLevel


class CatchAttemptResult(BaseModel):
    """Request to submit catch attempt result"""
    pokemon_id: int
    success: bool
    buttons_correct: int = Field(..., description="Number of buttons pressed correctly")
    total_buttons: int = Field(..., description="Total buttons in sequence")
    time_taken: float = Field(..., description="Total time taken in seconds")
    perfect: bool = Field(default=False, description="Whether all buttons were hit quickly")
    # NEW: Include difficulty for XP calculation
    difficulty: Optional[str] = Field(default="medium", description="Difficulty level for XP calculation")


class CatchResult(BaseModel):
    """Response after catch attempt"""
    success: bool
    message: str
    pokemon_name: str
    accuracy: float = Field(..., description="Percentage of buttons correct")
    perfect: bool = Field(default=False, description="Perfect catch bonus")
    reward_message: str = Field(default="", description="Bonus reward message if perfect")
    xp_awarded: int = 0
    new_level: int = 1
    leveled_up: bool = False
