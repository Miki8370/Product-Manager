from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from schemas.product_schemas import ProductCreate, ProductResponse
from database.connection import get_db
from dependencies.auth import admin_required
from models.produts import Products, Category


router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/")
def get_products(db: Session = Depends(get_db)):

    products = db.query(Products).all()
    return products

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Products).filter(Products.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    
    return product


@router.post("/add_products")
def add_products(product: ProductCreate, db: Session = Depends(get_db), admin = Depends(admin_required)):
    category = db.query(Category).filter(Category.id == product.category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    new_product = Products(**product.dict())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {
        "message": "Product created successfully",
        "product": new_product
    }



@router.patch("/update/{product_id}/")
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db), admin = Depends(admin_required)):
    existing_product = db.query(Products).filter(Products.id == product_id).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    
    for key, value in product.dict().items():
        setattr(existing_product, key, value)

    db.commit()
    db.refresh(existing_product)

    return {"message": "Product updated", "product": existing_product}
    
    
@router.delete(("/delete/{product_id}"))
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Products).filter(Products.id == product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    
    db.delete(product)
    db.commit()
    return {"massage": "prooduct Deleted"}
