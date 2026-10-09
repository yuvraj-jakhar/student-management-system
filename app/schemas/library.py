from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BookCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    author: str = Field(..., min_length=2, max_length=150)
    isbn: str = Field(..., min_length=5, max_length=30)
    category: str = Field(..., min_length=2, max_length=100)
    publisher: Optional[str] = None
    edition: Optional[str] = None
    total_copies: int = Field(default=1, ge=1)
    shelf_location: Optional[str] = None
    description: Optional[str] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    category: Optional[str] = None
    publisher: Optional[str] = None
    edition: Optional[str] = None
    total_copies: Optional[int] = Field(default=None, ge=1)
    shelf_location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BookIssueRequest(BaseModel):
    book_id: str
    student_id: str
    due_days: Optional[int] = Field(default=14, ge=1, le=60)
    notes: Optional[str] = None


class BookReturnRequest(BaseModel):
    issue_id: str
    remarks: Optional[str] = None


class BookRenewRequest(BaseModel):
    issue_id: str
    additional_days: Optional[int] = Field(default=14, ge=1, le=30)
