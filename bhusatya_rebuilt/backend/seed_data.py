from sqlalchemy.orm import Session
from backend.database import SessionLocal, Base, engine
from backend.models import User, LandParcel, ReferenceRecord
from backend.security import hash_password

def seed_database():
    """Initializes tables and seeds default users, reference records, and cadastral parcels."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Users
        if db.query(User).count() == 0:
            users_to_seed = [
                User(
                    full_name="Rajeshwar Rao, IAS",
                    email="admin@bhusatya.gov.in",
                    mobile_number="+919820011223",
                    hashed_password=hash_password("Admin@12345"),
                    role="admin",
                    verification_status="VERIFIED"
                ),
                User(
                    full_name="Ananya Sharma",
                    email="citizen@bhusatya.in",
                    mobile_number="+919876543210",
                    hashed_password=hash_password("Citizen@12345"),
                    role="applicant",
                    verification_status="VERIFIED"
                ),
                User(
                    full_name="Vasantrao Ganpatrao Deshmukh",
                    email="owner@bhusatya.in",
                    mobile_number="+919422034567",
                    hashed_password=hash_password("Owner@12345"),
                    role="approver",
                    verification_status="VERIFIED"
                )
            ]
            db.add_all(users_to_seed)
            db.commit()
            print("[Seed] Seeded default users (admin, applicant, approver)")

        # 2. Seed Reference Records
        if db.query(ReferenceRecord).count() == 0:
            records = [
                ReferenceRecord(
                    state="Maharashtra",
                    district="Pune",
                    tehsil="Mulshi",
                    village="Hinjawadi",
                    khasra_number="142/3",
                    gat_number="142",
                    owner_name="Vasantrao Ganpatrao Deshmukh",
                    land_area="1.45 Ha (3.58 Acres)",
                    area_ha=1.45,
                    is_disputed=False,
                    mortgage_details="Bank of Maharashtra, Hinjawadi Branch - Rs 15,00,000 charge",
                    source_name="Maharashtra Mahabhulekh 7/12 Digital Database"
                ),
                ReferenceRecord(
                    state="Maharashtra",
                    district="Pune",
                    tehsil="Haveli",
                    village="Wagholi",
                    khasra_number="284/1A",
                    gat_number="284",
                    owner_name="Sanjay Baburao Patil",
                    land_area="2.10 Ha (5.18 Acres)",
                    area_ha=2.10,
                    is_disputed=True,
                    dispute_details="Civil Court Pune Stay Order #CS-2022-849 (Coparcenary Partition)",
                    source_name="Maharashtra Mahabhulekh 7/12 Digital Database"
                ),
                ReferenceRecord(
                    state="Madhya Pradesh",
                    district="Bhopal",
                    tehsil="Huzur",
                    village="Berasia Road",
                    khasra_number="58/2",
                    owner_name="Ramesh Chandra Sharma",
                    land_area="0.85 Ha (2.10 Acres)",
                    area_ha=0.85,
                    is_disputed=False,
                    source_name="MP Bhulekh Land Records System"
                ),
                ReferenceRecord(
                    state="Uttar Pradesh",
                    district="Lucknow",
                    tehsil="Sarojini Nagar",
                    village="Amausi",
                    khasra_number="312/G",
                    owner_name="Dinesh Kumar Yadav",
                    land_area="1.20 Ha (2.96 Acres)",
                    area_ha=1.20,
                    is_disputed=False,
                    source_name="UP Bhulekh Digital Registry"
                )
            ]
            db.add_all(records)
            db.commit()
            print("[Seed] Seeded authorized reference records")

        # 3. Seed Cadastral Parcels
        if db.query(LandParcel).count() == 0:
            parcels = [
                LandParcel(
                    state="Maharashtra",
                    district="Pune",
                    tehsil="Mulshi",
                    village="Hinjawadi",
                    khasra_number="142/3",
                    gat_number="142",
                    ulpin="MH-PUN-MUL-0142-3",
                    owner_name="Vasantrao Ganpatrao Deshmukh",
                    latitude=18.5913,
                    longitude=73.7389,
                    area_ha=1.45,
                    classification="Agricultural",
                    coordinate_source="Official Cadastral GIS (MahaBhunaksha)",
                    location_accuracy="High (±1.5m Cadastral Boundary)"
                ),
                LandParcel(
                    state="Maharashtra",
                    district="Pune",
                    tehsil="Haveli",
                    village="Wagholi",
                    khasra_number="284/1A",
                    gat_number="284",
                    ulpin="MH-PUN-HAV-0284-1",
                    owner_name="Sanjay Baburao Patil",
                    latitude=18.5780,
                    longitude=73.9850,
                    area_ha=2.10,
                    classification="Commercial / NA In-Process",
                    coordinate_source="Official Cadastral GIS (MahaBhunaksha)",
                    location_accuracy="High (±2.0m Cadastral Boundary)"
                ),
                LandParcel(
                    state="Madhya Pradesh",
                    district="Bhopal",
                    tehsil="Huzur",
                    village="Berasia Road",
                    khasra_number="58/2",
                    ulpin="MP-BHP-HUZ-0058-2",
                    owner_name="Ramesh Chandra Sharma",
                    latitude=23.3280,
                    longitude=77.4120,
                    area_ha=0.85,
                    classification="Agricultural",
                    coordinate_source="MP Bhu-Naksha Digital Cadastre",
                    location_accuracy="High (±2.5m Cadastral Boundary)"
                ),
                LandParcel(
                    state="Uttar Pradesh",
                    district="Lucknow",
                    tehsil="Sarojini Nagar",
                    village="Amausi",
                    khasra_number="312/G",
                    ulpin="UP-LKO-SRJ-0312-G",
                    owner_name="Dinesh Kumar Yadav",
                    latitude=26.7606,
                    longitude=80.8893,
                    area_ha=1.20,
                    classification="Agricultural",
                    coordinate_source="UP Bhu-Naksha Cadastral Mapping",
                    location_accuracy="High (±1.8m Cadastral Boundary)"
                )
            ]
            db.add_all(parcels)
            db.commit()
            print("[Seed] Seeded cadastral land parcels")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
