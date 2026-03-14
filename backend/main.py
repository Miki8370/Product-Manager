from fastapi import FastAPI
from router import registration, auth, admin, category, products
from services.admin_starter import create_admin
from database.connection import SessionLocal

app = FastAPI()

app.include_router(registration.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(category.router)
app.include_router(products.router)


@app.on_event("startup")
def startup():

    db = SessionLocal()
    create_admin(db)
    db.close()
