from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.apps.users.models import User
from app.apps.ai.schemas import (
    PromptRequest,
    AIResponse,
    VoiceTranscript,
    RiskAssessment,
    HealthQueryRequest,
    NutritionPlanRequest,
    NutritionPlanResponse
)
from app.apps.ai.service import gemini_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate", response_model=AIResponse)
async def generate_response(
    request: PromptRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate AI response using Gemini API"""
    return await gemini_service.generate(request.text)


@router.post("/analyze-voice", response_model=RiskAssessment)
async def analyze_voice_transcript(
    request: VoiceTranscript,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze voice transcript and extract medical data with risk assessment"""
    # Extract medical data
    extracted = await gemini_service.extract_medical_data(request.transcript)
    
    # Assess risk
    risk_assessment = await gemini_service.assess_risk(extracted)
    
    # If critical risk and beneficiary_id provided, we could auto-trigger SOS
    # (This would be handled by the frontend based on should_trigger_sos)
    
    return risk_assessment


@router.post("/health-query")
async def get_health_guidance(
    request: HealthQueryRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI health guidance for a query"""
    guidance = await gemini_service.get_health_guidance(
        request.query, 
        request.language
    )
    return {"guidance": guidance}


@router.post("/nutrition-plan", response_model=NutritionPlanResponse)
async def generate_nutrition_plan(
    request: NutritionPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate personalized nutrition plan"""
    plan = await gemini_service.generate_nutrition_plan(
        user_type=request.user_type,
        age=request.age,
        anemia_status=request.anemia_status,
        pregnancy_week=request.pregnancy_week
    )
    
    return NutritionPlanResponse(
        plan=plan,
        recommendations=plan.get("recommendations", []),
        iron_rich_foods=plan.get("iron_rich_foods", []),
        meals=plan.get("meals", [])
    )


@router.post("/extract-visit-data")
async def extract_visit_data(
    request: PromptRequest,
    current_user: User = Depends(get_current_user)
):
    """Extract structured visit data from ASHA worker's voice transcription"""
    try:
        result = await gemini_service.generate(
            f"""Extract structured data from this ASHA worker's visit notes and return as JSON:

Visit Notes: "{request.text}"

Return JSON with these fields (use null for missing data):
{{
  "patient_name": string or null,
  "visit_type": "routine_checkup" | "emergency" | "follow_up" | "vaccination" | null,
  "vitals": {{
    "blood_pressure_systolic": number or null,
    "blood_pressure_diastolic": number or null,
    "weight_kg": number or null,
    "temperature_celsius": number or null
  }},
  "symptoms": [list of symptoms],
  "symptom_severity": "mild" | "moderate" | "severe" | null,
  "services_provided": [list of services],
  "medicines_distributed": [list of medicines],
  "counseling_topics": [list of topics discussed],
  "observations": string or null,
  "concerns_noted": string or null,
  "follow_up_required": boolean,
  "next_visit_date": "YYYY-MM-DD" or null,
  "referral_needed": boolean,
  "referral_reason": string or null
}}

Only return the JSON, no other text."""
        )
        
        # Try to parse JSON from response
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', result.response)
        if json_match:
            try:
                data = json.loads(json_match.group())
                return data
            except json.JSONDecodeError:
                pass
        
        return {
            "observations": result.response,
            "follow_up_required": False,
            "referral_needed": False,
        }
    except Exception as e:
        return {
            "error": str(e),
            "observations": request.text,
            "follow_up_required": False,
            "referral_needed": False,
        }


@router.get("/health")
async def health_check():
    """Check if AI service is healthy"""
    try:
        # Try a simple call to check connectivity
        response = await gemini_service.generate("Hello")
        return {
            "status": "healthy" if response.success else "degraded",
            "gemini_api": response.success
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

