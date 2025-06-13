from database import engine, Base  
import models  

print("Tentando criar tabelas no banco de dados...")

Base.metadata.create_all(bind=engine, checkfirst=True)

print("Tabelas verificadas/criadas com sucesso (se não existiam)!")