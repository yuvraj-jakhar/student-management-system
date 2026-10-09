from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(default="Workshop") # Workshop, Seminar, Hackathon, Cultural, Sports, Placement
    venue: str = Field(..., min_length=2)
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    capacity: int = Field(default=50, ge=1)
    organizer: str = Field(..., min_length=2)
    banner_url: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    organizer: Optional[str] = None
    banner_url: Optional[str] = None
    status: Optional[str] = None # published, upcoming, ongoing, completed, cancelled
