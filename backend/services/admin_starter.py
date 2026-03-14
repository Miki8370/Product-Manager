from sqlalchemy.orm import Session
from models.users import User, Role
from core.security import hash_password

def create_admin(db: Session):

    admin = db.query(User).filter(User.role == Role.admin).first()
    
    if admin:
        return
    
    new_admin = new_admin = User(
        first_name="System",
        last_name="Admin",
        username="admin",
        email="admin@system.com",
        password=hash_password("admin123"),
        role=Role.admin,
        is_approved=True
    )

    db.add(new_admin)
    db.commit()

    print("System admin created")