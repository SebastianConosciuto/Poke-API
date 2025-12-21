"""
Models for Pokemon catching minigame
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum

class DifficultyLevel(str, Enum):
    """Difficulty levels for catching - Based on Pokemon total stats"""
    WEAK = "weak"          # 180-300 stats: 3 buttons, 1.5s per button
    EASY = "easy"          # 301-400 stats: 4 buttons, 1.2s per button
    MEDIUM = "medium"      # 401-500 stats: 5 buttons, 1.0s per button
    HARD = "hard"          # 501-600 stats: 6 buttons, 0.8s per button
    LEGENDARY = "legendary" # 601-720 stats: 7 buttons, 0.6s per button
    MYTHICAL = "mythical"  # 721+ stats: 8 buttons, 0.5s per button

class CatchRequest(BaseModel):
    """Request to start a catch attempt"""
    region: str = Field(..., description="Pokemon region (kanto, johto, hoenn, etc.)")
    habitat: str = Field(..., description="Pokemon habitat (grassland, forest, cave, etc.)")
    difficulty: DifficultyLevel = Field(..., description="Difficulty level")

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

class CatchResult(BaseModel):
    """Response after catch attempt"""
    success: bool
    message: str
    pokemon_name: str
    accuracy: float = Field(..., description="Percentage of buttons correct")
    perfect: bool = Field(default=False, description="Perfect catch bonus")
    reward_message: str = Field(default="", description="Bonus reward message if perfect")