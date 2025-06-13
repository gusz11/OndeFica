from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv 

load_dotenv() # 

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ALERTA: DATABASE_URL não definida no .env. Usando SQLite local 'ondefica_dev.db' para desenvolvimento.")
    DATABASE_URL = "sqlite:///./ondefica_dev.db" 

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False} 
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()