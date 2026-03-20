from fastapi import FastAPI
from router import registration, auth, admin, category, products, cart, orders, payment
from services.admin_starter import create_admin
from database.connection import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(registration.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(category.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payment.router)


@app.on_event("startup")
def startup():

    db = SessionLocal()
    create_admin(db)
    db.close()
