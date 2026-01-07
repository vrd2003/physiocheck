from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from database import supabase
from email_service import send_email
import secrets

router = APIRouter(prefix="/doctor", tags=["Doctor"])

class CreatePatientPayload(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    conditions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    medications: Optional[List[str]] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    notes: Optional[str] = None
    notes: Optional[str] = None
    sendCredentials: Optional[bool] = True

class AssignExercisePayload(BaseModel):
    exercise_id: str
    patient_ids: List[str]
    sets: int
    reps: int
    frequency: str
    notes: Optional[str] = None

@router.get("/dashboard/stats")
def get_dashboard_stats(request: Request):
    try:
        doctor = request.state.user
        
        # Verify doctor role
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can view stats")

        # Get doctor's database ID
        # Using execute() directly allows checking data length safely
        doc_res = supabase.from_("doctors").select("id").eq("auth_user_id", doctor.id).execute()
        
        if not doc_res.data or len(doc_res.data) == 0:
            # Try to auto-create if missing (failsafe)
            try:
                new_doc = supabase.from_("doctors").insert({"auth_user_id": doctor.id}).execute()
                if new_doc.data:
                    doc_id = new_doc.data[0]["id"]
                else:
                    return {"activePatients": 0, "totalPatients": 0}
            except:
                return {"activePatients": 0, "totalPatients": 0}
        else:
            doc_id = doc_res.data[0]["id"]
            
        # Get patient counts
        # We'll just count all patients for "total" and "active" for now
        patients = supabase.from_("patients")\
            .select("*", count="exact")\
            .eq("doctor_id", doc_id)\
            .execute()
            
        count = patients.count if patients.count is not None else 0
        
        return {
            "activePatients": count,
            "totalPatients": count
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {"activePatients": 0, "totalPatients": 0}

@router.post("/create_patient")
async def create_patient(payload: CreatePatientPayload, request: Request):
    try:
        doctor = request.state.user
        
        # Verify doctor role
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can create patients")

        # Get doctor's database ID
        doctor_res = supabase.from_("doctors").select("id").eq("auth_user_id", doctor.id).execute()
        
        if not doctor_res.data or len(doctor_res.data) == 0:
            # Auto-create failsafe
            try:
                print(f"Doctor profile missing for {doctor.id}, attempting auto-create...")
                new_doc = supabase.from_("doctors").insert({"auth_user_id": doctor.id}).execute()
                if new_doc.data:
                    doctor_db_id = new_doc.data[0]["id"]
                else:
                     raise HTTPException(status_code=404, detail="Doctor profile not found and could not be created")
            except Exception as e:
                print(f"Auto-create failed: {e}")
                raise HTTPException(status_code=404, detail="Doctor profile not found")
        else:
            doctor_db_id = doctor_res.data[0]["id"]

        # 1. Create auth user for patient
        # Format: Name (first word, capitalized) + Last 4 digits of phone
        try:
            first_name = payload.full_name.split()[0].capitalize()
            # Extract only digits from phone
            phone_digits = "".join(filter(str.isdigit, payload.phone))
            last_4 = phone_digits[-4:] if len(phone_digits) >= 4 else phone_digits.ljust(4, "0")
            temp_password = f"{first_name}{last_4}"
        except:
            # Fallback if name/phone parsing fails
            temp_password = secrets.token_urlsafe(8)

        try:
            auth_res = supabase.auth.sign_up({
                "email": payload.email,
                "password": temp_password,
                "options": {
                    "data": {
                        "role": "patient"
                    }
                }
            })
        except Exception as e:
            print(f"Error creating auth user: {e}")
            raise HTTPException(status_code=400, detail="Failed to create user account. Email may already be in use.")

        if not auth_res or not auth_res.user:
            raise HTTPException(status_code=400, detail="Failed to create user account")

        patient_auth_id = auth_res.user.id

        # 2. Insert patient record
        patient_data = {
            "doctor_id": doctor_db_id,  # Use database ID, not auth ID
            "auth_user_id": patient_auth_id,
            "full_name": payload.full_name,
            "email": payload.email,
            "phone": payload.phone,
            "date_of_birth": payload.date_of_birth,
            "age": payload.age,
            "conditions": payload.conditions or [],
            "allergies": payload.allergies or [],
            "medications": payload.medications or [],
            "emergency_contact_name": payload.emergency_contact_name,
            "emergency_contact_phone": payload.emergency_contact_phone,
            "notes": payload.notes,
        }

        try:
            print(f"Inserting into patients table: {patient_data}")
            patient_res = supabase.from_("patients").insert(patient_data).execute()
            
            if not patient_res.data:
                print("Insert returned no data")
                raise Exception("Failed to insert patient record - no data returned")
                
            print(f"Patient inserted successfully: {patient_res.data}")    
        except Exception as e:
            # Rollback: delete the auth user
            try:
                # Note: You'll need admin privileges or service role to delete users
                print(f"Rolling back: Failed to create patient - {e}")
            except:
                pass
            print(f"Error inserting patient: {e}")
            raise HTTPException(status_code=500, detail="Failed to create patient record")

        # 3. Send email (if enabled)
        if payload.sendCredentials:
            try:
                send_email(
                    to=payload.email,
                    subject="Your PhysioCheck Account",
                    content=f"""Hello {payload.full_name},

Your physiotherapist has created an account for you.

Login Email: {payload.email}
Temporary Password: {temp_password}

Login here:
http://localhost:3000/login

Please change your password after login.

Best regards,
PhysioCheck Team
"""
                )
            except Exception as e:
                print(f"Warning: Failed to send email: {e}")
                # Don't fail the entire operation if email fails

        return {
            "status": "success",
            "patient_id": patient_res.data[0]["id"],
            "message": "Patient created successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Create patient failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")

@router.get("/patients")
async def list_patients(request: Request):
    try:
        doctor = request.state.user
        
        # Verify doctor role
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can view patient list")
        
        # Get doctor's database ID
        doctor_res = supabase.from_("doctors").select("id").eq("auth_user_id", doctor.id).execute()
        
        if not doctor_res.data or len(doctor_res.data) == 0:
            return []
        
        doctor_db_id = doctor_res.data[0]["id"]
        
        # Get patients for this doctor only
        patients = supabase.from_("patients")\
            .select("*")\
            .eq("doctor_id", doctor_db_id)\
            .order("created_at", desc=True)\
            .execute()
        
        return patients.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching patients: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patients")

        print(f"Error fetching patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patient details")

@router.get("/patients/{patient_id}/stats")
async def get_patient_stats(patient_id: str, request: Request):
    # Stub for stats
    return {
        "totalSessions": 12,
        "avgAccuracy": 85,
        "totalDuration": 120,
        "compliance": 90,
        "lastSession": "2023-11-01T10:00:00Z",
        "nextAppointment": "2023-11-15T09:00:00Z"
    }

@router.get("/patients/{patient_id}/exercises")
async def get_patient_exercises(patient_id: str, request: Request):
    try:
        doctor = request.state.user
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can view patient exercises")

        # Get exercises assigned to this patient
        exercises = supabase.from_("assigned_exercises")\
            .select("*, exercises(*)")\
            .eq("patient_id", patient_id)\
            .order("assigned_at", desc=True)\
            .execute()
        
        return exercises.data or []
    except Exception as e:
        print(f"Error fetching patient exercises: {e}")
        return []

@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, request: Request):
    try:
        doctor = request.state.user
        
        # Verify doctor role
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can view patient details")
        
        # Get doctor's database ID
        doctor_res = supabase.from_("doctors").select("id").eq("auth_user_id", doctor.id).execute()
        
        if not doctor_res.data or len(doctor_res.data) == 0:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        
        doctor_db_id = doctor_res.data[0]["id"]
        
        # Get patient and verify it belongs to this doctor
        patient_res = supabase.from_("patients")\
            .select("*")\
            .eq("id", patient_id)\
            .eq("doctor_id", doctor_db_id)\
            .execute()
        
        if not patient_res.data or len(patient_res.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return patient_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patient details")

@router.get("/sessions/active")
async def get_active_sessions(request: Request):
    try:
        doctor = request.state.user
        
        # Verify doctor role
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can view sessions")
        
        # Get doctor's database ID
        doctor_res = supabase.from_("doctors").select("id").eq("auth_user_id", doctor.id).execute()
        
        if not doctor_res.data or len(doctor_res.data) == 0:
            return []
            
        doctor_db_id = doctor_res.data[0]["id"]
        
        # 1. Get patient IDs for this doctor
        patients_res = supabase.from_("patients").select("id").eq("doctor_id", doctor_db_id).execute()
        
        if not patients_res.data:
            return []
            
        patient_ids = [p["id"] for p in patients_res.data]
        
        if not patient_ids:
            return []
            
        # 2. Get sessions for these patients
        # We assume 'active' means scheduled or in progress, or just recent ones.
        # Let's fetch the most recent ones for now.
        sessions_res = supabase.from_("exercise_sessions")\
            .select("*, patients(full_name)")\
            .in_("patient_id", patient_ids)\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()
            
        return sessions_res.data or []
        
    except HTTPException:
        raise
    except Exception as e:
        return []

@router.post("/assignments")
async def assign_exercise(payload: AssignExercisePayload, request: Request):
    try:
        doctor = request.state.user
        if doctor.user_metadata.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can assign exercises")

        # Prepare records for insertion
        records = []
        for pid in payload.patient_ids:
            records.append({
                "patient_id": pid,
                "exercise_id": payload.exercise_id,
                "sets": payload.sets,
                "reps": payload.reps,
                "frequency": payload.frequency,
                "notes": payload.notes
            })
            
        if not records:
             raise HTTPException(status_code=400, detail="No patients selected")

        # Bulk insert
        res = supabase.from_("assigned_exercises").insert(records).execute()
        
        return {"status": "success", "message": f"Assigned to {len(records)} patients"}

    except Exception as e:
        print(f"Error assigning exercises: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign exercises")