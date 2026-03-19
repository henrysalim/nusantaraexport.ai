from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config.db_config import execute_query

router = APIRouter()

class UMKMProfile(BaseModel):
    user_id: str
    business_name: str
    owner_name: str
    product_category: str
    production_capacity_monthly: float
    hpp_per_unit: float
    location: str

@router.post("/save")
async def save_profile(profile: UMKMProfile):
    query = """
    INSERT INTO umkm_profiles (
        user_id, business_name, owner_name, product_category, 
        production_capacity_monthly, hpp_per_unit, location
    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        owner_name = EXCLUDED.owner_name,
        product_category = EXCLUDED.product_category,
        production_capacity_monthly = EXCLUDED.production_capacity_monthly,
        hpp_per_unit = EXCLUDED.hpp_per_unit,
        location = EXCLUDED.location,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id;
    """
    params = (
        profile.user_id, profile.business_name, profile.owner_name,
        profile.product_category, profile.production_capacity_monthly,
        profile.hpp_per_unit, profile.location
    )
    
    try:
        result = execute_query(query, params, fetch=True)
        return {"id": result[0]['id'], "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_profile(user_id: str):
    query = "SELECT * FROM umkm_profiles WHERE user_id = %s"
    result = execute_query(query, (user_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Profil tidak ditemukan")
    return result[0]
