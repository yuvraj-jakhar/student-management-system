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
    source: Optional[str] = "in_house" # in_house, instagram, riet_website, manual_social
    source_url: Optional[str] = None
    source_badge: Optional[str] = None


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
    source_url: Optional[str] = None
    is_date_unverified: Optional[bool] = None
    is_venue_unverified: Optional[bool] = None


class EventImportManualRequest(BaseModel):
    post_url: str = Field(..., min_length=5)
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    category: Optional[str] = Field(default="Campus Life")
    source: Optional[str] = Field(default="instagram") # instagram, riet_website, other
    banner_url: Optional[str] = None
    venue: Optional[str] = "RIET Campus, Jaipur"
    start_date: Optional[datetime] = None
    organizer: Optional[str] = "RIET Official"
    is_date_unverified: bool = True
    is_venue_unverified: bool = True
    notify_students: bool = False


class EventReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approved|rejected)$")
    remarks: Optional[str] = None
    notify_students: bool = False
