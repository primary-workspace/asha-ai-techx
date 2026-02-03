import httpx
from typing import Optional, List
from app.core.config import get_settings
from app.apps.ai.schemas import (
    PromptRequest,
    AIResponse,
    MedicalDataExtraction,
    RiskAssessment
)

settings = get_settings()


class GeminiService:
    """Service for interacting with hosted Gemini API"""
    
    def __init__(self):
        self.api_url = settings.GEMINI_API_URL
    
    async def generate(self, prompt: str) -> AIResponse:
        """Call the Gemini API to generate a response"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    json={"text": prompt}
                )
                response.raise_for_status()
                data = response.json()
                return AIResponse(
                    response=data.get("response", data.get("text", str(data))),
                    success=True
                )
        except httpx.HTTPError as e:
            return AIResponse(
                response="",
                success=False,
                error=f"API Error: {str(e)}"
            )
        except Exception as e:
            return AIResponse(
                response="",
                success=False,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def extract_medical_data(self, transcript: str) -> MedicalDataExtraction:
        """Extract structured medical data from voice transcript using AI"""
        prompt = f"""
        Extract medical information from this health-related transcript.
        Return a JSON with these fields:
        - bp_systolic: systolic blood pressure if mentioned (number or null)
        - bp_diastolic: diastolic blood pressure if mentioned (number or null)
        - symptoms: array of symptoms mentioned
        - mood: detected mood (happy, neutral, sad, tired, anxious, pain)
        - is_emergency: true if this sounds like an emergency
        
        Transcript: "{transcript}"
        
        Respond ONLY with valid JSON.
        """
        
        response = await self.generate(prompt)
        
        if not response.success:
            return MedicalDataExtraction(raw_text=transcript)
        
        try:
            # Try to parse JSON from response
            import json
            data = json.loads(response.response)
            return MedicalDataExtraction(
                bp_systolic=data.get("bp_systolic"),
                bp_diastolic=data.get("bp_diastolic"),
                symptoms=data.get("symptoms", []),
                mood=data.get("mood"),
                is_emergency=data.get("is_emergency", False),
                raw_text=transcript
            )
        except:
            return MedicalDataExtraction(raw_text=transcript)
    
    async def assess_risk(self, data: MedicalDataExtraction) -> RiskAssessment:
        """Assess health risk based on extracted data"""
        risk_level = "low"
        should_sos = False
        guidance = "Aap theek hain. Aaram karein aur paani piyein."
        
        # Critical symptoms check
        critical_keywords = ["bleeding", "kharoon", "khoon", "seizure", "unconscious", "behosh", "severe pain", "bahut dard"]
        if any(kw in str(data.symptoms).lower() for kw in critical_keywords):
            risk_level = "critical"
            should_sos = True
            guidance = "Yeh gambhir lag raha hai. Turant ASHA didi ya hospital se sampark karein."
        
        # High risk BP check
        elif data.bp_systolic and data.bp_systolic >= 140:
            risk_level = "high"
            guidance = "Aapka blood pressure thoda zyada hai. ASHA didi se milein."
        
        elif data.bp_diastolic and data.bp_diastolic >= 90:
            risk_level = "high"
            guidance = "Aapka blood pressure thoda zyada hai. ASHA didi se milein."
        
        # Medium risk symptoms
        elif len(data.symptoms) >= 3:
            risk_level = "medium"
            guidance = "Kuch symptoms hain. Agar takleef badhe, ASHA didi ko batayein."
        
        return RiskAssessment(
            risk_level=risk_level,
            extracted_data=data,
            guidance=guidance,
            should_trigger_sos=should_sos
        )
    
    async def get_health_guidance(self, query: str, language: str = "hi") -> str:
        """Get health guidance for a query in the specified language"""
        lang_instruction = "Hindi" if language == "hi" else "English"
        
        prompt = f"""
        You are ASHA AI, a health companion for rural Indian women.
        Respond to this health query in simple {lang_instruction}.
        Be culturally sensitive and provide practical, safe advice.
        If the query indicates an emergency, strongly advise seeking immediate medical help.
        
        Query: "{query}"
        
        Respond in 2-3 short sentences maximum.
        """
        
        response = await self.generate(prompt)
        return response.response if response.success else "Kshama karein, abhi response nahi mil pa raha."
    
    async def generate_nutrition_plan(
        self, 
        user_type: str,
        age: Optional[int] = None,
        anemia_status: Optional[str] = None,
        pregnancy_week: Optional[int] = None
    ) -> dict:
        """Generate a personalized nutrition plan"""
        context = f"User type: {user_type}"
        if age:
            context += f", Age: {age}"
        if anemia_status:
            context += f", Anemia: {anemia_status}"
        if pregnancy_week:
            context += f", Pregnancy week: {pregnancy_week}"
        
        prompt = f"""
        Create a simple nutrition plan for a rural Indian woman.
        Context: {context}
        
        Focus on:
        - Iron-rich foods (especially if anemic)
        - Affordable, locally available foods
        - Simple preparation methods
        
        Return a JSON with:
        - recommendations: array of 3-4 short tips
        - iron_rich_foods: array of iron-rich food names
        - meals: array of 3 meal suggestions with name and description
        
        Respond ONLY with valid JSON.
        """
        
        response = await self.generate(prompt)
        
        if response.success:
            try:
                import json
                return json.loads(response.response)
            except:
                pass
        
        # Default plan if AI fails
        return {
            "recommendations": [
                "Har din hara saag khayein",
                "Gur aur chana milakr khayein",
                "Nimbu paani piyein (iron absorb karne mein madad)"
            ],
            "iron_rich_foods": ["Palak", "Chana", "Gur", "Chaulai", "Methi"],
            "meals": [
                {"name": "Nashta", "description": "Gur ki roti, doodh"},
                {"name": "Dopahar", "description": "Dal, chawal, aur palak sabzi"},
                {"name": "Raat", "description": "Roti, chane ki sabzi, aur salad"}
            ]
        }


# Singleton instance
gemini_service = GeminiService()
