from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum


# ============================
# Role Enum
# ============================

class RoleEnum(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"
    can_create_student = "can_create_student"


# ============================
# Register Schema
# ============================

class UserRegister(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: str
    role: List[RoleEnum]
    phone_no: Optional[str] = None
    image: Optional[str] = None


# ============================
# Update Schema
# ============================

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_no: Optional[str] = None
    image: Optional[str] = None
    role: Optional[List[RoleEnum]] = None


# ============================
# Login Schema
# ============================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================
# User Response
# ============================

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    role: List[RoleEnum]
    phone_no: Optional[str] = None
    image: Optional[str] = None


# ============================
# Token Response
# ============================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ============================
# Forgot Password
# ============================

class ForgotPassword(BaseModel):
    email: EmailStr


# ============================
# Reset Password
# ============================

class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str


# ============================
# Login Request
# ============================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str