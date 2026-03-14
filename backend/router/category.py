from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from schemas.product_schemas import CategoryRequest
from models.produts import Category
from database.connection import get_db
from dependencies.auth import admin_required


router = APIRouter(prefix="/category", tags=["Category"])

@router.post("/add_category/")
def add_categor(category: CategoryRequest, db: Session = Depends(get_db), admin=Depends(admin_required)):
	existing_category = db.query(Category).filter(Category.name == category.name).first()

	if existing_category:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category already exists")

	new_category = Category(name=category.name)
	
	db.add(new_category)
	db.commit()
	db.refresh(new_category)

	return{"massage": "New categroy created succesdfully", "category_id": new_category.id}



@router.get("/")
def get_categories(db: Session = Depends(get_db)):
	
	categories = db.query(Category).all()
	return categories

@router.patch("/category/{category_id}/delete/")
def del_category(category_id: int, db: Session = Depends(get_db), admin=Depends(admin_required)):
	
	category = db.query(Category).filter(Category.id == category_id).first()
	if not category:
		raise HTTPException(404, "Category not found")
	db.delete(category)
	db.commit()
	return {"massage": "Category Deleted"}



    
		