import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    
    class Config:
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        extra = "ignore"

settings = Settings()

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client.nutri_insight_grid

# Collections
users_collection = db.users
assessments_collection = db.assessments
patients_collection = db.patients
otps_collection = db.otps

# Setup TTL Index for OTPs (expire after 10 minutes)
async def setup_db_indexes():
    await otps_collection.create_index("created_at", expireAfterSeconds=600)
    await users_collection.create_index("email", unique=True)
    print("DB: Indexes (TTL for OTPs, Unique for Emails) ensured.")

async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})

async def create_user(user_data: dict):
    print(f"DB: Inserting user {user_data.get('email')}")
    user = await users_collection.insert_one(user_data)
    new_user = await users_collection.find_one({"_id": user.inserted_id})
    return new_user

async def update_user_password(email: str, hashed_password: str):
    await users_collection.update_one(
        {"email": email},
        {"$set": {"hashed_password": hashed_password}}
    )

async def update_user_settings(email: str, notifications_enabled: bool):
    print(f"DB: Updating settings for {email}: notifications={notifications_enabled}")
    return await users_collection.update_one(
        {"email": email},
        {"$set": {"notifications_enabled": notifications_enabled}}
    )

async def get_users_with_notifications():
    cursor = users_collection.find({"notifications_enabled": True})
    return await cursor.to_list(length=1000)

async def save_assessment(assessment_data: dict):
    print(f"DB: Inserting assessment for {assessment_data.get('patient_id')}")
    return await assessments_collection.insert_one(assessment_data)

async def get_all_assessments():
    print("DB: Fetching all assessments")
    cursor = assessments_collection.find({})
    return await cursor.to_list(length=1000)

async def get_latest_assessment_by_user(email: str):
    print(f"DB: Fetching latest assessment for {email}")
    cursor = assessments_collection.find({"user_email": email}).sort("timestamp", -1).limit(1)
    results = await cursor.to_list(length=1)
    return results[0] if results else None

async def save_patient(patient_data: dict):
    print(f"DB: Upserting patient {patient_data.get('patient_id')}")
    # Use upsert to avoid duplicates
    return await patients_collection.update_one(
        {"patient_id": patient_data["patient_id"]},
        {"$set": patient_data},
        upsert=True
    )

async def get_all_patients():
    cursor = patients_collection.find({})
    return await cursor.to_list(length=1000)

# OTP Functions
async def save_otp(email: str, otp: str):
    from datetime import datetime
    await otps_collection.delete_many({"email": email}) # Clear previous OTPs for this email
    return await otps_collection.insert_one({
        "email": email,
        "otp": otp,
        "created_at": datetime.utcnow()
    })

async def verify_otp(email: str, otp: str):
    record = await otps_collection.find_one({"email": email, "otp": otp})
    return record is not None

async def delete_otp(email: str):
    await otps_collection.delete_many({"email": email})

