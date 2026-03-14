from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from models.users import User
from schemas.user_schema import LoginRequest
from core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/login/")
async def login(user: LoginRequest, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not db_user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    token = create_access_token({"user_id": db_user.id, "role": db_user.role.value})

    return {
        "access_token": token,
        "token_type": "bearer"
    }