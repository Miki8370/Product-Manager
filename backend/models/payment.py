from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Enum, Float, Text
from sqlalchemy.orm import relationship
from database.connection import Base
from datetime import datetime
from enum import Enum as PyEnum


class PaymentStatus(str, PyEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PaymentMethod(str, PyEnum):
    voucher = "voucher"
    cod = "cod"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)  
    payment_method = Column(String, nullable=False)
    voucher_image = Column(String, nullable=True)  
    voucher_notes = Column(Text, nullable=True)  
    amount = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)  
    rejection_reason = Column(Text, nullable=True)
    order = relationship("Order", back_populates="payment")
    verifier = relationship("User", foreign_keys=[verified_by])