from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.users import User
from dependencies.auth import admin_required
from models.produts import Category
from schemas.product_schemas import CategoryRequest

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users/pending")
def get_pending_users(db: Session = Depends(get_db), admin = Depends(admin_required)):
    users = db.query(User).filter(User.is_approved == False).all()

    return users

@router.patch("/users/{user_id}/approve")
def approve_users(user_id: int, db: Session = Depends(get_db), admin=Depends(admin_required)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")
    
    user.is_approved = True
    db.commit()
    return {"message": "User approved"}

@router.patch("/users/{user_id}/reject")
def approve_users(user_id: int, db: Session = Depends(get_db), admin=Depends(admin_required)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User rejected"}

@router.get("/users")
def get_users(db: Session = Depends(get_db), admin = Depends(admin_required)):
    users = db.query(User).all()

    return users

