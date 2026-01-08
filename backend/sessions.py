from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import supabase
from websocket import manager

router = APIRouter(prefix="/sessions", tags=["Sessions"])

class CreateSessionPayload(BaseModel):
    exercise_id: str
    duration_seconds: Optional[int] = None
    repetitions: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = "in_progress"

@router.post("")
def create_session(payload: CreateSessionPayload, request: Request):
    """Create a new exercise session"""
    try:
        user = request.state.user
        
        # Get patient record
        patient_res = supabase.from_("patients")\
            .select("id")\
            .eq("auth_user_id", user.id)\
            .limit(1)\
            .execute()
        
        if not patient_res.data or len(patient_res.data) == 0:
            print(f"Patient profile not found for user {user.id}")
            raise HTTPException(404, "Patient profile not found. Please complete your profile.")
        
        patient_id = patient_res.data[0]["id"]
        
        # Verify exercise exists
        exercise = supabase.from_("exercises")\
            .select("id")\
            .eq("id", payload.exercise_id)\
            .limit(1)\
            .execute()
        
        if not exercise.data or len(exercise.data) == 0:
            print(f"Exercise not found: {payload.exercise_id}")
            raise HTTPException(404, "Exercise not found")
        
        # Create session
        session_data = {
            "patient_id": patient_id,
            "exercise_id": payload.exercise_id,
            "duration_seconds": payload.duration_seconds or 0,
            "repetitions": payload.repetitions or 0,
            "notes": payload.notes,
            "status": payload.status,
            "started_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.from_("exercise_sessions")\
            .insert(session_data)\
            .execute()
        
        if not result.data:
            print("Failed to insert session, result data empty")
            print(f"Result error: {result}")
            raise Exception("Failed to create session")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error creating session: {e}")
        # Improve error message if it's the specific PGRST116
        if "PGRST116" in str(e):
             raise HTTPException(404, "Data not found (PGRST116). Likely missing patient profile or exercise.")
        raise HTTPException(500, f"Failed to create exercise session: {str(e)}")

@router.patch("/{session_id}")
async def update_session(session_id: str, payload: dict, request: Request):
    """Update an existing exercise session"""
    try:
        user = request.state.user
        
        # Get patient record
        patient_res = supabase.from_("patients")\
            .select("id")\
            .eq("auth_user_id", user.id)\
            .single()\
            .execute()
        
        if not patient_res.data:
            raise HTTPException(404, "Patient profile not found")
        
        patient_id = patient_res.data["id"]
        
        # Verify session belongs to this patient
        session = supabase.from_("exercise_sessions")\
            .select("*")\
            .eq("id", session_id)\
            .eq("patient_id", patient_id)\
            .single()\
            .execute()
        
        if not session.data:
            raise HTTPException(404, "Session not found")
        
        # Update session
        update_data = {}
        if "duration_seconds" in payload:
            update_data["duration_seconds"] = payload["duration_seconds"]
        if "repetitions" in payload:
            update_data["repetitions"] = payload["repetitions"]
        if "notes" in payload:
            update_data["notes"] = payload["notes"]
        if "status" in payload:
            update_data["status"] = payload["status"]
            if payload["status"] == "completed":
                update_data["completed_at"] = datetime.utcnow().isoformat()
        
        result = supabase.from_("exercise_sessions")\
            .update(update_data)\
            .eq("id", session_id)\
            .execute()
        
        if not result.data:
            raise Exception("Failed to update session")
        
        # Notify doctor if session is updated
        await manager.signal_to_doctor(patient_id, {
            "type": "session_update",
            "session_id": session_id,
            "status": update_data.get("status"),
            "data": result.data[0]
        })
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating session: {e}")
        raise HTTPException(500, "Failed to update exercise session")

@router.get("/{session_id}")
def get_session(session_id: str, request: Request):
    """Get details of a specific session"""
    try:
        user = request.state.user
        
        # Get patient record
        patient_res = supabase.from_("patients")\
            .select("id")\
            .eq("auth_user_id", user.id)\
            .single()\
            .execute()
        
        if not patient_res.data:
            raise HTTPException(404, "Patient profile not found")
        
        patient_id = patient_res.data["id"]
        
        # Get session
        session = supabase.from_("exercise_sessions")\
            .select("*, exercises(*)")\
            .eq("id", session_id)\
            .eq("patient_id", patient_id)\
            .single()\
            .execute()
        
        if not session.data:
            raise HTTPException(404, "Session not found")
        
        return session.data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching session: {e}")
        raise HTTPException(500, "Failed to fetch session details")