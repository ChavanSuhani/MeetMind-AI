from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    avatar_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None
    type: str | None = None
