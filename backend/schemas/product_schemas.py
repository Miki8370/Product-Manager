from pydantic import BaseModel

class CategoryRequest(BaseModel):
    name: str


class ProductCreate(BaseModel):
    name: str
    description: str
    brand: str
    model: str
    quality: str
    price: int
    stock_level: int
    category_id: int

class ProductResponse(BaseModel):
    brand: str
    model: str
    quality: str
    price: int
    stock_level: int
    category_id: int

    class config:
        orm_mode = True