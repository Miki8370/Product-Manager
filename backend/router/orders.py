from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime

from database.connection import get_db
from dependencies.auth import admin_required, get_current_user
from models.order import Order, OrderItem, OrderStatus
from models.payment import Payment, PaymentStatus, PaymentMethod
from models.cart import Cart, CartItem
from models.produts import Products
from schemas.order_schemas import OrderResponse, OrderDetailResponse
from schemas.payment import PaymentCreate, PaymentUploadVoucher, PaymentVerify

router = APIRouter(prefix="/order", tags=["Order"])

def calculate_order_total(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return 0
    
    total = 0
    for item in order.items:
        product = db.query(Products).filter(Products.id == item.product_id).first()
        if product:
            total += product.price * item.quantity
    
    order.total_amount = total
    db.commit()
    return total

@router.post("/checkout")
def checkout(payment_method: str,  db: Session = Depends(get_db), user = Depends(get_current_user)):

    if not user.is_approved:  
        raise HTTPException(403, "Account not approved by admin yet")
    
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    
    if not cart or not cart.items:
        raise HTTPException(400, "Cart is empty")
    
    for item in cart.items:
        product = db.query(Products).filter(Products.id == item.product_id).first()
        if product.stock_level < item.quantity:
            raise HTTPException(
                400, 
                f"Product {product.name} has only {product.stock_level} units available"
            )
    
    order = Order(
        user_id=user.id,
        status=OrderStatus.pending_payment,
        payment_method=payment_method
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    total_amount = 0
    
    for item in cart.items:
        product = db.query(Products).filter(Products.id == item.product_id).first()
        order_item = OrderItem(
            order_id=order.id, 
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_time=product.price  
        )
        db.add(order_item)
        total_amount += product.price * item.quantity
        
        product.reserved_stock = (product.reserved_stock or 0) + item.quantity
        db.add(product)
    
    order.total_amount = total_amount
    db.commit()
    
    payment = Payment(
        order_id=order.id,
        payment_method=payment_method,
        amount=total_amount,
        status=PaymentStatus.pending
    )
    db.add(payment)
    db.commit()
    
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    
    return {
        "message": "Order created successfully",
        "order_id": order.id,
        "total_amount": total_amount,
        "payment_status": "pending",
        "next_step": "Upload voucher" if payment_method == "voucher" else "Awaiting COD confirmation"
    }

@router.post("/{order_id}/upload-voucher")
async def upload_voucher(order_id: int, file: UploadFile = File(...), notes: str = None, db: Session = Depends(get_db), user = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    
    if not order:
        raise HTTPException(404, "Order not found")
    
    if order.payment_method != "voucher":
        raise HTTPException(400, "This order is not for voucher payment")
    
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(404, "Payment record not found")
    
    if payment.status != PaymentStatus.pending:
        raise HTTPException(400, f"Payment already {payment.status}")
    
    upload_dir = "uploads/vouchers"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"voucher_order_{order_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    payment.voucher_image = file_path
    payment.voucher_notes = notes
    
    db.commit()
    
    return {
        "message": "Voucher uploaded successfully",
        "order_id": order_id,
        "status": "pending_verification"
    }

@router.get("/pending-verification")
def get_pending_verifications(
    db: Session = Depends(get_db),
    admin = Depends(admin_required)  
):
    pending_payments = db.query(Payment).filter(
        Payment.status == PaymentStatus.pending
    ).all()
    
    result = []
    for payment in pending_payments:
        order = payment.order
        user = order.user
        
        user_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
        
        result.append({
            "payment_id": payment.id,
            "order_id": order.id,
            "technician": {
                "id": user.id,
                "name": user_name,
                "email": user.email
            },
            "amount": payment.amount,
            "payment_method": payment.payment_method,
            "voucher_image": payment.voucher_image if payment.payment_method == "voucher" else None,
            "order_date": order.order_date,
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product.name,
                    "quantity": item.quantity,
                    "price": item.price_at_time
                }
                for item in order.items
            ]
        })
    
    return result

@router.post("/verify-payment/{payment_id}")
def verify_payment(
    payment_id: int,
    verification: PaymentVerify,
    db: Session = Depends(get_db),
    admin = Depends(admin_required)  
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    
    if payment.status != PaymentStatus.pending:
        raise HTTPException(400, f"Payment already {payment.status}")
    
    order = payment.order
    
    if verification.status == "approved":
        for item in order.items:
            product = db.query(Products).filter(Products.id == item.product_id).first()
            
            available_stock = product.stock_level - (product.reserved_stock or 0)
            if available_stock < item.quantity:
                raise HTTPException(
                    400, 
                    f"Not enough stock for {product.name}. Available: {available_stock}"
                )
            
            product.stock_level -= item.quantity
            product.reserved_stock = (product.reserved_stock or 0) - item.quantity
            
            db.add(product)
        
        payment.status = PaymentStatus.approved
        payment.verified_at = datetime.utcnow()
        payment.verified_by = admin.id
        
        order.status = OrderStatus.payment_verified
        
        message = "Payment approved and inventory updated"
        
    else:  
        for item in order.items:
            product = db.query(Products).filter(Products.id == item.product_id).first()
            if product.reserved_stock:
                product.reserved_stock -= item.quantity
            db.add(product)
        
        payment.status = PaymentStatus.rejected
        payment.rejection_reason = verification.rejection_reason
        order.status = OrderStatus.cancelled
        
        message = "Payment rejected"
    
    db.commit()
    
    
    return {
        "message": message,
        "order_id": order.id,
        "payment_status": payment.status
    }

@router.get("/", response_model=List[OrderResponse])
def get_orders(
    db: Session = Depends(get_db), 
    user = Depends(get_current_user)
):
    orders = db.query(Order).filter(Order.user_id == user.id).all()
    
    result = []
    for order in orders:
        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
        result.append({
            "id": order.id,
            "order_date": order.order_date,
            "status": order.status,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "payment_status": payment.status if payment else None,
            "item_count": len(order.items)
        })
    
    return result

@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order_detail(order_id: int, db: Session = Depends(get_db),user = Depends(get_current_user)):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user.id
    ).first()
    
    if not order:
        raise HTTPException(404, "Order not found")
    
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    
    items = []
    for item in order.items:
        product = db.query(Products).filter(Products.id == item.product_id).first()
        items.append({
            "product_id": item.product_id,
            "product_name": product.name if product else "Unknown",
            "quantity": item.quantity,
            "price": item.price_at_time,
            "subtotal": item.price_at_time * item.quantity
        })
    
    return {
        "id": order.id,
        "order_date": order.order_date,
        "status": order.status,
        "total_amount": order.total_amount,
        "payment_method": order.payment_method,
        "payment": {
            "id": payment.id if payment else None,
            "status": payment.status if payment else None,
            "voucher_image": payment.voucher_image if payment and payment.payment_method == "voucher" else None,
            "verified_at": payment.verified_at if payment else None,
            "rejection_reason": payment.rejection_reason if payment else None
        },
        "items": items
    }


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    admin = Depends(admin_required)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(404, "Order not found")
    
    valid_statuses = ["pending_payment", "payment_verified", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid_statuses}")
    
    order.status = status
    db.commit()
    
    return {
        "message": f"Order #{order_id} status updated to {status}",
        "order_id": order_id,
        "status": status
    }



@router.get("/admin/orders")
def get_all_orders(
    db: Session = Depends(get_db),
    admin = Depends(admin_required)
):
    orders = db.query(Order).all()
    
    result = []
    for order in orders:
        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
        user = order.user
        user_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
        
        result.append({
            "id": order.id,
            "order_date": order.order_date,
            "status": order.status,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "payment_status": payment.status if payment else None,
            "item_count": len(order.items),
            "user_name": user_name
        })
    
    return result