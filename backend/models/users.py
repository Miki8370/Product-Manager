from sqlalchemy import Column, Integer, String, Boolean, Enum
from database.connection import Base
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

