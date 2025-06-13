from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import aiohttp
import asyncio
import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from math import radians, sin, cos, sqrt, atan2
from cachetools import TTLCache
from datetime import timedelta
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

import database    
import models      
import schemas     
import crud_users  
import auth        
from config import settings 

load_dotenv()
app = FastAPI()

BLOCKED_PLACES = {
    "ChIJJ7YnMd4vWpMRf5TAuddeMU0",
    "ChIJ-Yxzrfo6WpMRxXd9M0MgM04",
    "ChIJdQ45Ijw7WpMRv66nxMnigHk",
    "ChIJ77dWhao7WpMRs-nM_kni9gs",
    "ChIJ9zopoOMzWpMRhPPd07pdg4c",
    "ChIJq6qqmnU6WpMRSR7fHcJLHEY",
    "ChIJ68IvlWkjWpMRWicAHZ6IReU",
    "ChIJQbQXW-06WpMR1R78lfFCh-c",
    "ChIJP7z9X5g6WpMRYy-8hzzXRCw",
    "ChIJqefzbnw6WpMRcqqfx1nW6Rg",
    "ChIJ14rptYIxWpMRkCiLq2wxaF8",
    "ChIJKzIBHl07WpMRlc0fsxZUvKs",
}

MANUAL_PLACE_INFO = {
    "ChIJ23SBb_Q6WpMRaEHSG-Z_3i4": {
        "entry_fee": "Gratuito",
        "category": "Museum",
        "capacity": "82 lugares",
    },
    "ChIJB1dBAh47WpMRNcjExvu1kpY": {
        "entry_fee": "Gratuito",
        "capacity": "25 pessoas",
    },
    "ChIJG8T4pto7WpMRw7-WM9H0-2I": {
        "custom_description": "A Torre de TV é um marco visual da cidade. É a segunda estrutura mais alta do Brasil, com 230 metros de altura, pode ser avistada de longe.",
        "entry_fee": "Gratuito",
        "capacity": "150 pessoas",
    },
     "ChIJV0M4HpswWpMRSGVFxX0b-Kg": {
        "entry_fee": "Gratuito",
        "capacity": "100 pessoas",
        "category": "Museum"
    },
     "ChIJxzvkC0c7WpMRts7g9RrMvwE": {
        "entry_fee": "Gratuito",
        "capacity": "espaço aberto",
    },
     "ChIJkZofTCI7WpMRGY1p6TGy-1U": {
        "entry_fee": "Gratuito",
        "capacity": "4000 pessoas",
    },
     "ChIJsaNDbnw6WpMRBWuFQRuyCiM": {
        "entry_fee": "10R$",
    },
     "ChIJyZX6n0c7WpMRuAT1BzyeilY": {
        "entry_fee": "Gratuito",
        "capacity": "espaço aberto",
    },
}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache = TTLCache(maxsize=100, ttl=3600)
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("ERRO FATAL: GOOGLE_PLACES_API_KEY não definida.")

# Validação inicial dos IDs bloqueados
for place_id in BLOCKED_PLACES:
    if not isinstance(place_id, str) or not place_id.strip():
        raise ValueError(f"ID de lugar bloqueado inválido: {place_id}")

# Validação inicial das informações manuais
for place_id, info in MANUAL_PLACE_INFO.items():
    if not isinstance(place_id, str) or not place_id.strip():
        raise ValueError(f"ID de lugar manual inválido: {place_id}")
    if not isinstance(info, dict):
        raise ValueError(f"Informações manuais inválidas para place_id: {place_id}")

def get_photo_url(photo_reference: str, max_width: int = 400) -> Optional[str]:
    if not photo_reference:
        return None
    return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={photo_reference}&key={GOOGLE_API_KEY}"

def calculate_haversine_distance(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> Optional[float]:
    if None in [lat1, lon1, lat2, lon2] or any(not isinstance(x, (int, float)) for x in [lat1, lon1, lat2, lon2]):
        return None
    R = 6371.0; lat1_f, lon1_f, lat2_f, lon2_f = float(lat1), float(lon1), float(lat2), float(lon2)
    lat1_rad, lon1_rad = radians(lat1_f), radians(lon1_f); lat2_rad, lon2_rad = radians(lat2_f), radians(lon2_f)
    dlon, dlat = lon2_rad - lon1_rad, lat2_rad - lat1_rad
    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a)); return R * c

async def fetch_json_from_google(session: aiohttp.ClientSession, url: str, caller_info: str = "") -> Dict[str, Any]:
    print(f"Chamando API ({caller_info}): {url.split('&key=')[0]}...")
    try:
        async with session.get(url, timeout=10) as response:
            response.raise_for_status()
            return await response.json()
    except Exception as e:
        print(f"Exceção em fetch_json_from_google ({caller_info}): {e}")
        return {"status": "REQUEST_EXCEPTION", "error_message": str(e), "results": []}

async def get_place_details_from_api(session: aiohttp.ClientSession, place_id: str, fields: str) -> Dict[str, Any]:
    cache_key = f"details_{place_id}_{fields}"
    if cache_key in cache: 
        print(f"Cache hit para detalhes: {place_id}")
        return cache[cache_key]
    details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields={fields}&key={GOOGLE_API_KEY}&language=pt-BR"
    details_response = await fetch_json_from_google(session, details_url, caller_info=f"Place Details {place_id}")
    if details_response.get("status") == "OK":
        details_result = details_response.get("result", {})
        cache[cache_key] = details_result
        return details_result
    return {}

async def get_nearby_hotels_from_api(session: aiohttp.ClientSession, lat: float, lng: float, radius: int = 2000) -> List[Dict[str, Any]]:
    if lat is None or lng is None: return []
    cache_key = f"hotels_v3_{lat}_{lng}_{radius}"
    if cache_key in cache: 
        print(f"Cache hit para hotéis: {lat}, {lng}")
        return cache[cache_key]
    hotels_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius}&type=lodging&key={GOOGLE_API_KEY}&language=pt-BR"
    hotels_search_data = await fetch_json_from_google(session, hotels_url, caller_info=f"Nearby Hotels {lat},{lng}")
    if hotels_search_data.get("status") != "OK": return []
    
    final_hotels_list, initial_hotel_data_map = [], {}
    for hotel_result_data in hotels_search_data.get("results", [])[:3]:
        hotel_id = hotel_result_data.get("place_id")
        if not hotel_id: continue
        distance_km = calculate_haversine_distance(lat, lng, hotel_result_data.get("geometry", {}).get("location", {}).get("lat"), hotel_result_data.get("geometry", {}).get("location", {}).get("lng"))
        initial_hotel_data_map[hotel_id] = {
            "id": hotel_id, "name": hotel_result_data.get("name"), "rating": hotel_result_data.get("rating"),
            "imageUrl": get_photo_url(hotel_result_data.get("photos", [{}])[0].get("photo_reference")) if hotel_result_data.get("photos") else None,
            "address": hotel_result_data.get("vicinity"), "distance": f"{distance_km:.1f} km" if distance_km is not None else "N/D"
        }
    
    hotel_detail_tasks = {hid: get_place_details_from_api(session, hid, "website") for hid in initial_hotel_data_map.keys()}
    detailed_hotel_infos = await asyncio.gather(*hotel_detail_tasks.values(), return_exceptions=True)
    
    for (hotel_id, hotel_data), details_result in zip(initial_hotel_data_map.items(), detailed_hotel_infos):
        hotel_data["website"] = None if isinstance(details_result, Exception) or not details_result else details_result.get("website")
        final_hotels_list.append(hotel_data)
        
    cache[cache_key] = final_hotels_list
    return final_hotels_list

async def process_single_place(session: aiohttp.ClientSession, place_id: str, initial_place_data: Dict) -> Optional[Dict[str, Any]]:
    details_fields = "name,formatted_address,international_phone_number,opening_hours,website,photo,editorial_summary,url,types,geometry,rating,user_ratings_total"
    details_data = await get_place_details_from_api(session, place_id, details_fields)
    if not details_data: return None
    
    place_lat, place_lng = details_data.get("geometry", {}).get("location", {}).get("lat"), details_data.get("geometry", {}).get("location", {}).get("lng")
    main_image_url = get_photo_url(details_data.get("photos", [{}])[0].get("photo_reference")) if details_data.get("photos") else (get_photo_url(initial_place_data.get("photos", [{}])[0].get("photo_reference")) if initial_place_data.get("photos") else None)
    
    description_short = "N/A"; editorial_overview = details_data.get("editorial_summary", {}).get("overview")
    if editorial_overview: description_short = editorial_overview[:150] + "..." if len(editorial_overview) > 150 else editorial_overview
    elif details_data.get("types"): description_short = ", ".join([t.replace("_", " ").capitalize() for t in details_data.get("types", [])[:2]])
    elif details_data.get("formatted_address"): description_short = details_data.get("formatted_address")

    long_description = editorial_overview or details_data.get("formatted_address", "N/A")
    hours_str = "\n".join(details_data.get("opening_hours", {}).get("weekday_text", [])) or "Consultar"
    
    hotels = await get_nearby_hotels_from_api(session, place_lat, place_lng) if place_lat and place_lng else []

    # Incorporar informações manuais, se disponíveis
    manual_info = MANUAL_PLACE_INFO.get(place_id, {})
    result = {
        "id": place_id,
        "title": details_data.get("name", "N/A"),
        "description": manual_info.get("custom_description", description_short),
        "imageUrl": main_image_url,
        "longDescription": manual_info.get("custom_description", long_description),
        "hours": manual_info.get("custom_hours", hours_str),
        "entryFee": manual_info.get("entry_fee", "Consultar"),
        "phone_number": details_data.get("international_phone_number", "N/A"),
        "formatted_address": details_data.get("formatted_address", "N/A"),
        "Maps_url": details_data.get("url"),
        "types": details_data.get("types", []),
        "latitude": place_lat,
        "longitude": place_lng,
        "locationImageUrl": main_image_url,
        "hotels": hotels,
        "rating": details_data.get("rating"),
        "user_ratings_total": details_data.get("user_ratings_total"),
        "website": details_data.get("website"),
        "category": manual_info.get("category", "N/A"),
        "capacity": manual_info.get("capacity", "N/A")
    }

    print(f"Informações manuais aplicadas para {place_id}: {manual_info}")
    return result

@app.post("/auth/register", response_model=schemas.UserResponse, tags=["Authentication"])
async def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud_users.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já registrado")
    return crud_users.create_user(db=db, user=user)

@app.post("/auth/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud_users.get_user_by_email(db, email=form_data.username)
    if not user or not crud_users.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=schemas.Token, tags=["Authentication"])
async def login_with_google(token_data: schemas.GoogleIdToken, db: Session = Depends(database.get_db)):
    try:
        idinfo = google_id_token.verify_oauth2_token(token_data.id_token, google_requests.Request(), audience=os.getenv("GOOGLE_ANDROID_CLIENT_ID"))
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']: 
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Emissor do token inválido")
        user_email, user_name = idinfo['email'], idinfo.get('name', idinfo['email'].split('@')[0])
        db_user = crud_users.get_user_by_email(db, email=user_email)
        if not db_user:
            user_create_schema = schemas.UserCreate(email=user_email, password=os.urandom(16).hex(), full_name=user_name)
            db_user = crud_users.create_user(db, user=user_create_schema)
        if not db_user.is_active: 
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        app_access_token = auth.create_access_token(data={"sub": db_user.email, "user_id": db_user.id}, expires_delta=access_token_expires)
        return {"access_token": app_access_token, "token_type": "bearer"}
    except ValueError as e: 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token do Google inválido ou expirado")
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro interno ao processar login com Google: {e}")

@app.get("/users/me/", response_model=schemas.UserResponse, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@app.post("/admin/clear_cache", tags=["Admin"])
async def clear_cache(current_user: models.User = Depends(auth.get_current_active_user)):
    cache.clear()
    print("Cache limpo com sucesso.")
    return {"message": "Cache limpo com sucesso."}

@app.get("/api/pontos", tags=["Places"])
async def get_pontos_turisticos_endpoint(limit: int = 10):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Chave da API do Google não configurada.")

    search_query = "atrações turísticas e monumentos em Brasília DF"
    cache_key = f"pontos_bsb_{search_query}_{limit}".replace(" ", "_")
    
    # Limpar o cache para garantir dados atualizados
    cache.clear()
    print(f"Cache limpo para a requisição com cache_key: {cache_key}")

    text_search_fields = "place_id,name,photos,formatted_address,types,geometry,rating"
    text_search_url = (f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={search_query}&key={GOOGLE_API_KEY}&language=pt-BR&fields={text_search_fields}&type=tourist_attraction")
    
    final_processed_places = []
    async with aiohttp.ClientSession() as session:
        try:
            search_data = await fetch_json_from_google(session, text_search_url, caller_info="Text Search Principal")
            if search_data.get("status") not in ["OK", "ZERO_RESULTS"]:
                raise HTTPException(status_code=502, detail=f"Erro na API do Google (Text Search): {search_data.get('status')} - {search_data.get('error_message', '')}")

            initial_results = search_data.get("results", [])
            
            # Log de todos os pontos retornados pela API
            print("Pontos turísticos retornados pela API do Google:")
            for place in initial_results:
                place_id = place.get("place_id", "N/A")
                place_name = place.get("name", "N/A")
                print(f"ID: {place_id}, Nome: {place_name}")

            # Filtrar os resultados, excluindo os bloqueados
            filtered_results = []
            for place in initial_results:
                place_id = place.get("place_id")
                if not place_id:
                    print(f"Ponto ignorado por falta de place_id: {place.get('name', 'N/A')}")
                    continue
                # Normalizar place_id removendo prefixo "place-", se presente
                normalized_place_id = place_id.replace("place-", "")
                if normalized_place_id in BLOCKED_PLACES:
                    print(f"Ponto bloqueado filtrado: ID={place_id}, Nome={place.get('name', 'N/A')}")
                    continue
                place["place_id"] = normalized_place_id  # Atualizar place_id no resultado
                filtered_results.append(place)
            
            # Log dos pontos após a filtragem
            print("Pontos turísticos após filtragem:")
            for place in filtered_results:
                place_id = place.get("place_id", "N/A")
                place_name = place.get("name", "N/A")
                print(f"ID: {place_id}, Nome: {place_name}")

            # Limita o número de locais a serem detalhados
            places_to_detail = filtered_results[:limit]
            
            processing_tasks = []
            for initial_place_data in places_to_detail:
                place_id = initial_place_data.get("place_id")
                if not place_id: 
                    continue
                processing_tasks.append(process_single_place(session, place_id, initial_place_data))
            
            results_of_processing = await asyncio.gather(*processing_tasks, return_exceptions=True)

            for result in results_of_processing:
                if isinstance(result, Exception):
                    print(f"Erro ao processar um local durante gather: {result}")
                elif result:
                    final_processed_places.append(result)
            
            if final_processed_places:
                cache[cache_key] = final_processed_places
                print("Pontos turísticos finais processados e armazenados no cache:")
                for place in final_processed_places:
                    print(f"ID: {place['id']}, Nome: {place['title']}, Categoria: {place['category']}")

            return final_processed_places
        except Exception as e:
            print(f"Erro inesperado em /api/pontos: {type(e).__name__} - {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no servidor ao processar locais.")