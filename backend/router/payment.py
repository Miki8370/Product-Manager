from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database.connection import get_db
from dependencies.auth import get_current_user, admin_required
from models.order import Order, OrderItem
from models.payment import Payment
from models.produts import Products
import os
import shutil
from datetime import datetime

router = APIRouter(prefix="/payment", tags=["Payment"])

@router.post("/upload/{order_id}")
async def upload_voucher(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    
    upload_dir = "uploads/vouchers"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_name = f"voucher_{order_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        payment = Payment(
            order_id=order_id,
            amount=order.total_amount,
            payment_method="voucher",
            voucher_image=file_path,
            status="pending"
        )
        db.add(payment)
    else:
        payment.voucher_image = file_path
        payment.status = "pending"
    
    db.commit()
    
    return {"message": "Voucher uploaded successfully"}

@router.get("/pending")
def get_pending_payments(
    db: Session = Depends(get_db),
    admin = Depends(admin_required)
):
    payments = db.query(Payment).filter(Payment.status == "pending").all()
    
    result = []
    for payment in payments:
        order = payment.order
        result.append({
            "payment_id": payment.id,
            "order_id": order.id,
            "technician": order.user.name,
            "amount": payment.amount,
            "voucher": payment.voucher_image,
            "order_date": order.order_date
        })
    
    return result

@router.post("/approve/{payment_id}")
def approve_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    admin = Depends(admin_required)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    
    order = payment.order
    
    for item in order.items:
        product = db.query(Products).filter(Products.id == item.product_id).first()
        if product.stock_level < item.quantity:
            raise HTTPException(400, f"Not enough stock for {product.name}")
        product.stock_level -= item.quantity
    
    payment.status = "approved"
    payment.verified_at = datetime.utcnow()
    payment.verified_by = admin.id
    
    order.status = "payment_verified"
    
    db.commit()
    
    return {"message": "Payment approved, inventory updated"}

@router.post("/reject/{payment_id}")
def reject_payment(
    payment_id: int,
    reason: str = None,
    db: Session = Depends(get_db),
    admin = Depends(admin_required)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    
    payment.status = "rejected"
    payment.rejection_reason = reason
    payment.verified_at = datetime.utcnow()
    payment.verified_by = admin.id
    
    order = payment.order
    order.status = "cancelled"
    
    db.commit()
    
    return {"message": "Payment rejected"}

@router.post("/cod/{order_id}")
def set_cod(
    order_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    
    payment = Payment(
        order_id=order_id,
        amount=order.total_amount,
        payment_method="cod",
        status="pending"  
    )
    db.add(payment)
    
    order.payment_method = "cod"
    db.commit()
    
    return {"message": "Order marked for Cash on Delivery"}
