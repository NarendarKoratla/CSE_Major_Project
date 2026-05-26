from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    notifications_enabled: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    otp: str

class UserInDB(UserBase):
    hashed_password: str

class UserResponse(UserBase):
    id: str
    notifications_enabled: bool = True

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChangePassword(BaseModel):
    email: EmailStr
    old_password: str
    new_password: str = Field(..., min_length=6)

