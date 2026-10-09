from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=2)
    category: str = Field(default="general") # general, academic, library, event, alert
    target_role: Optional[str] = None # None means all, or "student", "teacher", "admin", "librarian"
    user_id: Optional[str] = None # specific user
    link: Optional[str] = None
