from pydantic import BaseModel

class AddToCartRequest(BaseModel):
    product_id: int
    quantity: int