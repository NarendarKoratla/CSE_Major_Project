from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import os
from typing import Optional
from contextlib import asynccontextmanager
import random
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
import asyncio
from datetime import datetime

load_dotenv()

# SMTP Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@nutrivision.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

from train import train_and_save, ensure_dirs, maybe_generate_synthetic
from database import (
    get_user_by_email, create_user, update_user_password, 
    save_assessment, get_all_assessments, get_latest_assessment_by_user, save_patient, 
    get_all_patients, save_otp, verify_otp, delete_otp, setup_db_indexes,
    update_user_settings, get_users_with_notifications
)
from models.user import UserCreate, UserResponse, UserLogin, ChangePassword
from passlib.context import CryptContext
from report_utils import generate_health_report


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure directories and database indexes
    base_dir = ensure_dirs()
    dataset_path = os.path.join(base_dir, "data", "dataset.csv")
    await setup_db_indexes()
    maybe_generate_synthetic(dataset_path)
    
    # Start background scheduler
    scheduler_task = asyncio.create_task(notification_scheduler())
    
    yield
    # Shutdown logic
    scheduler_task.cancel()


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


async def notification_scheduler():
    print("SCHEDULER: Starting background notification engine...")
    fm = FastMail(conf)
    
    while True:
        try:
            now = datetime.now()
            current_time = now.strftime("%H:%M") # Format: "06:00"
            
            # 1. Get all users with notifications enabled
            users = await get_users_with_notifications()
            
            if users:
                for user in users:
                    user_email = user["email"]
                    
                    # 2. Directly fetch latest assessment for this user
                    latest = await get_latest_assessment_by_user(user_email)
                    if not latest:
                        continue
                        
                    recommendations = latest.get("result", {}).get("recommendations", {})
                    schedule = recommendations.get("schedule", [])
                    
                    # Check if any schedule item matches current time
                    for item in schedule:
                        time_start = item["time"].split(" – ")[0].strip()
                        
                        if time_start == current_time:
                            # Send notification
                            print(f"SCHEDULER: Sending daily alert to {user_email} for activity: {item['activity']}")
                            
                            message = MessageSchema(
                                subject=f"NutriVision Reminder: {item['activity']}",
                                recipients=[user_email],
                                body=f"Hello {user.get('full_name', 'User')},\n\nIt's {current_time}. Here's your scheduled health activity:\n\n**{item['activity']}**\n{item['details']}\n\nStay consistent!\nNutriVision Team",
                                subtype=MessageType.plain
                            )
                            await fm.send_message(message)
            
        except Exception as e:
            print(f"SCHEDULER ERROR: {str(e)}")
            
        # Wait for 60 seconds (check once per minute)
        await asyncio.sleep(60)


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://127.0.0.1:8080", "http://127.0.0.1:8081", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictIn(BaseModel):
    age: int
    gender: str
    height: float
    weight: float


class PredictOut(BaseModel):
    bmi: float
    bmi_category: str
    risk: str
    risk_score: float


def bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25:
        return "Normal"
    if bmi < 30:
        return "Overweight"
    return "Obese"


def compute_bmi(height_cm: float, weight_kg: float) -> float:
    height_m = height_cm / 100.0
    return weight_kg / (height_m * height_m) if height_m > 0 else 0.0


def load_model():
    model_path = os.path.join(os.path.dirname(__file__), "models", "model.joblib")
    if not os.path.exists(model_path):
        return None
    return joblib.load(model_path)


@app.post("/predict", response_model=PredictOut)
def predict(inp: PredictIn):
    bmi = compute_bmi(inp.height, inp.weight)

    model = load_model()
    if model is not None:
        X = np.array(
            [[inp.age, 1 if inp.gender == "Male" else 0, inp.height, inp.weight]],
            dtype=float,
        )
        if hasattr(model, "predict_proba"):
            prob = float(model.predict_proba(X)[0, 1])
        else:
            prob = float(model.predict(X)[0])
            prob = max(0.0, min(1.0, prob))
    else:
        prob = 0.5

    risk = (
        "Critical" if prob >= 0.7 else "High" if prob >= 0.5 else "Moderate" if prob >= 0.3 else "Low"
    )
    return PredictOut(bmi=bmi, bmi_category=bmi_category(bmi), risk=risk, risk_score=prob)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/request-otp")
async def request_otp(data: dict):
    email = data.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user already exists
    existing_user = await get_user_by_email(email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User Already Exists")
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Save OTP to DB
    await save_otp(email, otp)
    
    # Create Message
    message = MessageSchema(
        subject="NutriVision Registration - Your OTP",
        recipients=[email],
        body=f"Your OTP for NutriVision registration is: {otp}. It will expire in 10 minutes.",
        subtype=MessageType.plain
    )
    
    fm = FastMail(conf)
    
    # Send Email
    try:
        await fm.send_message(message)
        print(f"DEBUG: OTP sent to {email}")
        return {"message": "OTP sent successfully"}
    except Exception as e:
        print(f"ERROR: Email delivery failed: {str(e)}")
        # If mail fails, at least log it and show the OTP in console for developer
        print(f"\n[FALLBACK] OTP for {email} is: {otp}\n")
        return {"message": "OTP sent successfully (Fallback active)"}


@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    user.email = user.email.lower().strip()
    print(f"DEBUG: Registering user {user.email}")
    
    # Verify OTP
    is_valid = await verify_otp(user.email, user.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]
    del user_dict["otp"]
    
    try:
        new_user = await create_user(user_dict)
        # Clear OTP after successful registration
        await delete_otp(user.email)
        print(f"DEBUG: User {new_user['email']} created successfully with ID {new_user['_id']}")
        return UserResponse(
            email=new_user["email"],
            full_name=new_user.get("full_name"),
            id=str(new_user["_id"]),
            notifications_enabled=new_user.get("notifications_enabled", True)
        )
    except Exception as e:
        print(f"ERROR: Registration failed: {str(e)}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


class ResetPasswordIn(BaseModel):
    email: str
    otp: str
    new_password: str

@app.post("/forgot-password-otp")
async def forgot_password_otp(data: dict):
    email = data.get("email", "").lower().strip()
    from fastapi import HTTPException
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    existing_user = await get_user_by_email(email)
    if not existing_user:
        raise HTTPException(status_code=400, detail="Account not found")
        
    otp = str(random.randint(100000, 999999))
    await save_otp(email, otp)
    
    message = MessageSchema(
        subject="NutriVision - Password Reset OTP",
        recipients=[email],
        body=f"Your OTP to reset your NutriVision password is: {otp}. It will expire in 10 minutes.",
        subtype=MessageType.plain
    )
    
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return {"message": "OTP sent successfully"}
    except Exception as e:
        print(f"ERROR: Email delivery failed: {str(e)}")
        print(f"\n[FALLBACK] OTP for {email} is: {otp}\n")
        return {"message": "OTP sent successfully (Fallback active)"}

@app.post("/reset-password")
async def reset_password(body: ResetPasswordIn):
    email = body.email.lower().strip()
    from fastapi import HTTPException
    is_valid = await verify_otp(email, body.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    hashed_password = get_password_hash(body.new_password)
    await update_user_password(email, hashed_password)
    await delete_otp(email)
    
    return {"message": "Password reset successful"}


@app.post("/login", response_model=UserResponse)
async def login(user: UserLogin):
    print(f"DEBUG: Login attempt for {user.email}")
    existing_user = await get_user_by_email(user.email)
    if not existing_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(user.password, existing_user["hashed_password"]):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid email or password")
    print(f"DEBUG: Login successful for {user.email}")
        
    return UserResponse(
        email=existing_user["email"],
        full_name=existing_user.get("full_name"),
        id=str(existing_user["_id"]),
        notifications_enabled=existing_user.get("notifications_enabled", True)
    )

@app.post("/change-password")
async def change_password(body: ChangePassword):
    existing_user = await get_user_by_email(body.email)
    from fastapi import HTTPException
    
    if not existing_user:
        raise HTTPException(status_code=400, detail="User not found")
        
    if not verify_password(body.old_password, existing_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid old password")
        
    new_hashed_password = get_password_hash(body.new_password)
    await update_user_password(body.email, new_hashed_password)
    
    return {"message": "Password updated successfully"}

@app.put("/users/settings")
async def update_settings_endpoint(data: dict):
    email = data.get("email")
    notifications_enabled = data.get("notifications_enabled")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    await update_user_settings(email, notifications_enabled)
    return {"message": "Settings updated successfully"}
    
@app.post("/save-assessment")
async def save_assessment_endpoint(request: Request):
    try:
        assessment = await request.json()
        print(f"DEBUG: Attempting to save assessment for patient {assessment.get('patient_id')}")
        
        # 1. Save to Database
        result = await save_assessment(assessment)
        print(f"DEBUG: Assessment saved successfully with ID {result.inserted_id}")
        
        # 2. Generate PDF Report
        pdf_filename = f"report_{assessment.get('patient_id')}.pdf"
        generate_health_report(assessment, pdf_filename)
        
        # 3. Send Email with PDF Attachment
        user_email = assessment.get("user_email")
        if user_email:
            message = MessageSchema(
                subject="NutriVision - Your Comprehensive Health Report",
                recipients=[user_email],
                body=f"Hello,\n\nPlease find attached your comprehensive health report for {assessment.get('patient_data', {}).get('name', 'your patient')}.\n\nBest regards,\nNutriVision Team",
                subtype=MessageType.plain,
                attachments=[pdf_filename]
            )
            fm = FastMail(conf)
            await fm.send_message(message)
            print(f"DEBUG: Report emailed to {user_email}")
            
            # Cleanup PDF after sending
            if os.path.exists(pdf_filename):
                os.remove(pdf_filename)
        else:
            print("WARNING: No user_email provided, cannot send report.")

        return {"status": "success", "id": str(result.inserted_id)}
    except Exception as e:
        print(f"ERROR: Failed to save assessment or send report: {str(e)}")
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.get("/assessments")
async def get_assessments_endpoint():
    print("DEBUG: Fetching all assessments")
    assessments = await get_all_assessments()
    # Convert ObjectId to string for JSON serialization
    for a in assessments:
        a["_id"] = str(a["_id"])
    return assessments

@app.post("/save-patient")
async def save_patient_endpoint(request: Request):
    try:
        patient = await request.json()
        print(f"DEBUG: Attempting to save patient {patient.get('patient_id')}")
        result = await save_patient(patient)
        print(f"DEBUG: Patient synced successfully")
        return {"status": "success"}
    except Exception as e:
        print(f"ERROR: Failed to save patient: {str(e)}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patients")
async def get_patients_endpoint():
    print("DEBUG: Fetching all patients")
    patients = await get_all_patients()
    for p in patients:
        p["_id"] = str(p["_id"])
    return patients




class TrainIn(BaseModel):
    csv_path: Optional[str] = None
    model: Optional[str] = "logreg"  # "logreg" or "rf"


@app.post("/train")
def train(body: TrainIn):
    base = ensure_dirs()
    csv = body.csv_path or os.path.join(base, "data", "dataset.csv")
    maybe_generate_synthetic(csv)
    result = train_and_save(csv, body.model or "logreg")
    return result


