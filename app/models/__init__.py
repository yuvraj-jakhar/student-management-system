from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum


class RoleEnum(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class UserRegister(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: str
    role: RoleEnum
    phone_no: Optional[str] = None
    image: Optional[str] = None


class CourseCreate(BaseModel):
    course_name: str
    course_code: str
    teacher_id: Optional[str] = None
    student_ids: List[str] = []


class AttendanceRecord(BaseModel):
    student_id: str
    course_id: str
    date: str
    status: str


class MarksRecord(BaseModel):
    student_id: str
    course_id: str
    marks: float