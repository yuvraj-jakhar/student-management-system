from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import List
from datetime import datetime


# -----------------------------
# User Roles
# -----------------------------

class RoleEnum(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


# -----------------------------
# User Register
# -----------------------------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum


# -----------------------------
# User Login
# -----------------------------

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -----------------------------
# JWT Token
# -----------------------------

class Token(BaseModel):
    access_token: str
    token_type: str


# -----------------------------
# Course
# -----------------------------

class CourseCreate(BaseModel):
    name: str
    code: str
    teacher_id: str
    student_ids: List[str] = []


# -----------------------------
# Attendance
# -----------------------------

class AttendanceRecord(BaseModel):
    student_id: str
    course_id: str
    date: datetime
    status: str


# -----------------------------
# Marks
# -----------------------------

class MarksRecord(BaseModel):
    student_id: str
    course_id: str
    marks: float


# -----------------------------
# Response Models
# -----------------------------

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: RoleEnum


class CourseResponse(BaseModel):
    id: str
    name: str
    code: str
    teacher_id: str
    student_ids: List[str]