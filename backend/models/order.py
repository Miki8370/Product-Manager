from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database.connection import Base
from enum import Enum as PyEnum

class OrderStatus(str, PyEnum):
    pending_payment = "pending_payment"
    payment_verified = "payment_verified"
    processing = "processing"
    completed = "completed"
    cancelled = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    order_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending_payment)
    total_amount = Column(Float, default=0.0)
    payment_method = Column(String, nullable=True)  
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price_at_time = Column(Float)  
    order = relationship("Order", back_populates="items")
    product = relationship("Products")



