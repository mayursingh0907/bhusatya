import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import LandParcel
from backend.schemas import LandParcelResponse

router = APIRouter(prefix="/api/parcels", tags=["Interactive Cadastral GIS & Maps"])

class MatchNearestRequest(BaseModel):
    latitude: float
    longitude: float

class MatchNearestResponse(BaseModel):
    parcel: LandParcelResponse
    distance_meters: float
    coordinate_source: str
    location_accuracy: str

@router.get("", response_model=List[LandParcelResponse])
def list_parcels(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(LandParcel)
    if state:
        q = q.filter(LandParcel.state.ilike(f"%{state}%"))
    if district:
        q = q.filter(LandParcel.district.ilike(f"%{district}%"))
    if village:
        q = q.filter(LandParcel.village.ilike(f"%{village}%"))
    if query:
        q = q.filter(
            (LandParcel.khasra_number.ilike(f"%{query}%")) |
            (LandParcel.gat_number.ilike(f"%{query}%")) |
            (LandParcel.owner_name.ilike(f"%{query}%")) |
            (LandParcel.village.ilike(f"%{query}%")) |
            (LandParcel.ulpin.ilike(f"%{query}%"))
        )

    parcels = q.limit(50).all()
    return [LandParcelResponse.model_validate(p) for p in parcels]

@router.get("/{parcel_id}", response_model=LandParcelResponse)
def get_parcel(parcel_id: str, db: Session = Depends(get_db)):
    parcel = db.query(LandParcel).filter(LandParcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Cadastral parcel not found")
    return LandParcelResponse.model_validate(parcel)

@router.post("/match-nearest", response_model=MatchNearestResponse)
def match_nearest_parcel(req: MatchNearestRequest, db: Session = Depends(get_db)):
    parcels = db.query(LandParcel).all()
    if not parcels:
        raise HTTPException(status_code=404, detail="No registered cadastral parcels in database")

    def haversine_dist(lat1, lon1, lat2, lon2):
        # approximate distance in meters
        r = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2) * math.sin(dlam/2)**2
        return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    nearest = None
    min_dist = float("inf")
    for p in parcels:
        dist = haversine_dist(req.latitude, req.longitude, p.latitude, p.longitude)
        if dist < min_dist:
            min_dist = dist
            nearest = p

    return MatchNearestResponse(
        parcel=LandParcelResponse.model_validate(nearest),
        distance_meters=round(min_dist, 1),
        coordinate_source="Nearest Cadastral Parcel Match (OpenStreetMap & Inferred Coordinates)",
        location_accuracy=f"±{round(min_dist, 1)}m offset from user coordinates"
    )
