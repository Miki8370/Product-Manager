from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price: float
    subtotal: float

class PaymentInfoResponse(BaseModel):
    id: Optional[int]
    status: Optional[str]
    voucher_image: Optional[str]
    verified_at: Optional[datetime]
    rejection_reason: Optional[str]

class OrderResponse(BaseModel):
    id: int
    order_date: datetime
    status: str
    total_amount: float
    payment_method: str
    payment_status: Optional[str]
    item_count: int
    
    class Config:
        from_attributes = True

class OrderDetailResponse(BaseModel):
    id: int
    order_date: datetime
    status: str
    total_amount: float
    payment_method: str
    payment: PaymentInfoResponse
    items: List[OrderItemResponse]
    
    class Config:
        from_attributes = True