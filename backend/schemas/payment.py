from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentBase(BaseModel):
    payment_method: str
    voucher_notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    order_id: int

class PaymentUploadVoucher(PaymentBase):
    voucher_image: str  

class PaymentVerify(BaseModel):
    status: str 
    rejection_reason: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_method: str
    amount: float
    status: str
    voucher_image: Optional[str]
    created_at: datetime
    verified_at: Optional[datetime]
    
    class Config:
        from_attributes = True