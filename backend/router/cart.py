from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.cart import Cart, CartItem
from models.produts import Products
from schemas.cart_schema import AddToCartRequest
from dependencies.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.post("/add")
def add_to_cart(data: AddToCartRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):

    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    product = db.query(Products).filter(Products.id == data.product_id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    
    cart_item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == data.product_id).first()

    if cart_item:
        cart_item.quantity += data.quantity

    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=data.product_id,
            quantity=data.quantity
        )
        db.add(cart_item)

    db.commit()
    return {"message": "Added to cart"}

@router.get("/")
def view_cart(db: Session = Depends(get_db), user = Depends(get_current_user)):

    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart:
        return {"cart": []}

    return cart.items

@router.delete("/item/{item_id}")
def remove_item(item_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    db.delete(item)
    db.commit()

    return {"message": "Item removed"}

@router.put("/item/{item_id}")
def update_quantity(item_id: int, quantity: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    
    if not item:
        raise HTTPException(404, "Item not found")
    
    if quantity <= 0:
        db.delete(item)
        db.commit()
        return {"message": "Item removed"}
    
    item.quantity = quantity
    db.commit()
    
    return {"message": "Quantity updated"}