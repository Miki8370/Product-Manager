from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from schemas.user_schema import RegistrationRequest

from database.connection import get_db  
from models.users import User, Role

router = APIRouter()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):

    if len(password.encode('utf-8')) > 72:
        password = password[:72]  
    return pwd_context.hash(password)


@router.post("/signup/", status_code=status.HTTP_201_CREATED)
async def signup(user: RegistrationRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        email=user.email,
        password=hash_password(user.password),  
        role=Role.user,
        is_approved=False    
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully, waiting for admin approval",
        "user_id": new_user.id
    }