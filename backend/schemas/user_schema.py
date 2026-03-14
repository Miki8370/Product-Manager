from pydantic import BaseModel, EmailStr, Field


class RegistrationRequest(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)  


class LoginRequest(BaseModel):
    username: str
    password: str