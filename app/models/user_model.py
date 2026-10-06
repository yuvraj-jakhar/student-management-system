from pydantic import BaseModel, EmailStr
from typing import Optional


class UserModel(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: str
    role: str
    phone_no: Optional[str] = None
    image: Optional[str] = None