from database.connection import Base, engine
from models.users import User

Base.metadata.create_all(bind=engine)

print("Tables Created Succesfully")