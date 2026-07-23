# app/schemas/auth_schema.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    user_name: str
    email: EmailStr
    password: str

class PreferenceUpdate(BaseModel):
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    body_form: Optional[str] = None
    preferred_styles: Optional[str] = None
    liked_colors: Optional[str] = None
    disliked_colors: Optional[str] = None
