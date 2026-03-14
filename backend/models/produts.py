from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database.connection import Base
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    products = relationship("Products", back_populates="category")



class Products(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    brand = Column(String)
    model = Column(String)
    quality = Column(String)
    price = Column(Integer)
    stock_level = Column(Integer)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")
