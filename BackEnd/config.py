# OndeFicaBack/config.py
import os
from dotenv import load_dotenv

load_dotenv() 

class Settings:
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "uma_chave_secreta_padrao_muito_forte_e_dificil_de_adivinhar_troque_isso") 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 

settings = Settings()