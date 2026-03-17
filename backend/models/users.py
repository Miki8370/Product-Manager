from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from database.connection import Base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

import enum
class Role(enum.Enum):
    admin = "admin"
    user = 'user'

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.user)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    orders = relationship("Order", back_populates="user")


