from fastapi import APIRouter, HTTPException, Request
from database import supabase

router = APIRouter(prefix="/patient", tags=["Patient"])

@router.get("/my_exercises")
def my_exercises(request: Request):
    try:
        user = request.state.user
        
        # Get patient record first
        patient_res = supabase.from_("patients").select("id").eq("auth_user_id", user.id).single().execute()
        
        if not patient_res.data:
            raise HTTPException(404, "Patient profile not found")
        
        patient_id = patient_res.data["id"]
        
        exercises = supabase.from_("assigned_exercises")\
            .select("*, exercises(*)")\
            .eq("patient_id", patient_id)\
            .execute()
        
        if exercises.data:
            # print("Debugging my_exercises: First item:", exercises.data[0])
            # for ex in exercises.data:
            #     print(f"AssignID: {ex.get('id')} -> ExerciseID: {ex.get('exercise_id')}")
            pass

        return exercises.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching exercises: {e}")
        raise HTTPException(500, "Failed to fetch exercises")

@router.get("/session/history")
def session_history(request: Request):
    try:
        user = request.state.user
        
        # Get patient record first
        patient_res = supabase.from_("patients").select("id").eq("auth_user_id", user.id).single().execute()
        
        if not patient_res.data:
            raise HTTPException(404, "Patient profile not found")
        
        patient_id = patient_res.data["id"]
        
        # Get session history for this patient only
        sessions = supabase.from_("exercise_sessions")\
            .select("*")\
            .eq("patient_id", patient_id)\
            .order("created_at", desc=True)\
            .execute()
        
        return sessions.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching session history: {e}")
        raise HTTPException(500, "Failed to fetch session history")

@router.get("/dashboard/stats")
def dashboard(request: Request):
    try:
        user = request.state.user
        
        # Get patient record
        patient_res = supabase.from_("patients").select("id").eq("auth_user_id", user.id).single().execute()
        
        if not patient_res.data:
            return {"completed_sessions": 0, "total_exercises": 0}
        
        patient_id = patient_res.data["id"]
        
        # Get stats
        sessions = supabase.from_("exercise_sessions")\
            .select("*", count="exact")\
            .eq("patient_id", patient_id)\
            .eq("status", "completed")\
            .execute()
        
        exercises = supabase.from_("assigned_exercises")\
            .select("*", count="exact")\
            .eq("patient_id", patient_id)\
            .execute()
        
        return {
            "completed_sessions": sessions.count or 0,
            "total_exercises": exercises.count or 0
        }
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return {"completed_sessions": 0, "total_exercises": 0}