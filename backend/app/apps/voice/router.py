"""
Voice processing API routes for ASHA AI
Handles Whisper transcription and chat logging
"""
import os
import tempfile
import subprocess
from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.apps.users.models import User
from app.core.security import get_current_user, get_current_user_optional
from .models import AIChatHistory
from .schemas import (
    TranscriptionResponse,
    ChatLogRequest,
    ChatLogResponse,
    ChatHistoryResponse,
    ChatHistoryItem,
)

router = APIRouter(prefix="/voice", tags=["voice"])

# Whisper model settings
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

# Language code mapping
LANG_MAP = {
    'hi': 'hindi',
    'en': 'english',
    'hi-IN': 'hindi',
    'en-US': 'english',
    'en-IN': 'english',
    'gu': 'gujarati',
    'ta': 'tamil',
    'te': 'telugu',
    'kn': 'kannada',
    'ml': 'malayalam',
    'mr': 'marathi',
    'bn': 'bengali',
    'pa': 'punjabi',
}


def check_ffmpeg():
    """Check if FFmpeg is available"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False


async def transcribe_with_whisper(
    audio_path: str, 
    language: Optional[str] = None
) -> dict:
    """
    Transcribe audio using OpenAI Whisper
    Uses faster-whisper or whisper CLI depending on availability
    """
    try:
        # Try using the whisper CLI
        cmd = ['whisper', audio_path, '--model', WHISPER_MODEL, '--output_format', 'json']
        
        if language:
            whisper_lang = LANG_MAP.get(language, language)
            cmd.extend(['--language', whisper_lang])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode != 0:
            print(f"Whisper CLI error: {result.stderr}")
            raise Exception(f"Whisper failed: {result.stderr}")
        
        # Parse the JSON output
        import json
        output_file = audio_path.rsplit('.', 1)[0] + '.json'
        with open(output_file, 'r') as f:
            data = json.load(f)
        
        return {
            'transcript': data.get('text', '').strip(),
            'language': data.get('language', language or 'hi'),
            'confidence': None,
        }
        
    except FileNotFoundError:
        print("Whisper CLI not found, trying Python API...")
        # Fallback to Python API
        try:
            import whisper
            model = whisper.load_model(WHISPER_MODEL)
            result = model.transcribe(
                audio_path, 
                language=LANG_MAP.get(language, language) if language else None,
                fp16=False,
            )
            return {
                'transcript': result['text'].strip(),
                'language': result.get('language', language or 'hi'),
                'confidence': None,
            }
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Whisper is not installed. Please install with: pip install openai-whisper"
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail="Transcription timed out. Please try a shorter audio clip."
        )
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transcribe audio: {str(e)}"
        )


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(None, description="Language code (hi, en, etc.)"),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Transcribe audio file using Whisper
    
    Accepts audio files in various formats (webm, mp4, wav, ogg)
    Returns transcribed text with detected language
    """
    # Validate file type
    allowed_types = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/x-m4a']
    if audio.content_type and audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {audio.content_type}. Supported: {', '.join(allowed_types)}"
        )
    
    # Check file size (max 25MB)
    content = await audio.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Audio file too large. Maximum size is 25MB."
        )
    
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty."
        )
    
    # Get file extension
    ext = audio.filename.split('.')[-1] if audio.filename else 'webm'
    
    # Save to temp file
    with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as temp_file:
        temp_file.write(content)
        temp_path = temp_file.name
    
    try:
        # Convert to WAV if needed using FFmpeg
        if ext != 'wav' and check_ffmpeg():
            wav_path = temp_path.rsplit('.', 1)[0] + '.wav'
            subprocess.run([
                'ffmpeg', '-i', temp_path,
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',       # Mono
                '-y',             # Overwrite
                wav_path
            ], capture_output=True, check=True)
            transcribe_path = wav_path
        else:
            transcribe_path = temp_path
        
        # Transcribe
        result = await transcribe_with_whisper(transcribe_path, language)
        
        return TranscriptionResponse(
            transcript=result['transcript'],
            language=result['language'],
            confidence=result.get('confidence'),
        )
        
    finally:
        # Cleanup temp files
        import os
        for path in [temp_path, temp_path.rsplit('.', 1)[0] + '.wav', 
                     temp_path.rsplit('.', 1)[0] + '.json']:
            try:
                os.unlink(path)
            except FileNotFoundError:
                pass


@router.post("/log", response_model=ChatLogResponse, status_code=status.HTTP_201_CREATED)
async def log_chat_interaction(
    data: ChatLogRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Log a voice/chat interaction to the database
    
    Stores user message, AI response, language, and metadata
    """
    chat_log = AIChatHistory(
        user_id=current_user.id if current_user else None,
        beneficiary_id=data.beneficiary_id,
        user_message=data.user_message,
        ai_response=data.ai_response,
        language_used=data.language_used,
        is_emergency=data.is_emergency,
        intent=data.intent,
        category=data.category,
        audio_duration_seconds=data.audio_duration_seconds,
        transcription_confidence=data.transcription_confidence,
    )
    
    db.add(chat_log)
    await db.commit()
    await db.refresh(chat_log)
    
    return ChatLogResponse(
        id=chat_log.id,
        user_message=chat_log.user_message,
        ai_response=chat_log.ai_response,
        language_used=chat_log.language_used,
        is_emergency=chat_log.is_emergency,
        created_at=chat_log.created_at,
    )


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    beneficiary_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get chat history for the current user or a specific beneficiary
    
    ASHA workers and admins can view any beneficiary's history
    Beneficiaries can only view their own
    """
    query = select(AIChatHistory)
    
    # Role-based filtering
    if current_user.role == 'beneficiary':
        # Get own beneficiary profile
        from app.apps.beneficiaries.models import BeneficiaryProfile
        result = await db.execute(
            select(BeneficiaryProfile.id).where(BeneficiaryProfile.user_id == current_user.id)
        )
        ben_id = result.scalar_one_or_none()
        if ben_id:
            query = query.where(AIChatHistory.beneficiary_id == ben_id)
        else:
            query = query.where(AIChatHistory.user_id == current_user.id)
    elif beneficiary_id:
        query = query.where(AIChatHistory.beneficiary_id == beneficiary_id)
    elif current_user.role not in ('admin', 'partner'):
        # ASHA workers see their own chats only
        query = query.where(AIChatHistory.user_id == current_user.id)
    
    # Order by most recent
    query = query.order_by(desc(AIChatHistory.created_at))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return ChatHistoryResponse(
        items=[
            ChatHistoryItem(
                id=item.id,
                user_message=item.user_message,
                ai_response=item.ai_response,
                language_used=item.language_used,
                is_emergency=item.is_emergency,
                intent=item.intent,
                category=item.category,
                created_at=item.created_at,
            )
            for item in items
        ],
        total=total,
    )


@router.get("/emergency-count")
async def get_emergency_count(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get count of emergency interactions in the last N days
    
    Useful for ASHA worker dashboard
    """
    from datetime import timedelta
    
    since = datetime.utcnow() - timedelta(days=days)
    
    query = select(func.count()).select_from(AIChatHistory).where(
        AIChatHistory.is_emergency == True,
        AIChatHistory.created_at >= since,
    )
    
    # For ASHA workers, filter by their linked beneficiaries
    if current_user.role == 'asha_worker':
        from app.apps.beneficiaries.models import BeneficiaryProfile
        subquery = select(BeneficiaryProfile.id).where(
            BeneficiaryProfile.linked_asha_id == current_user.id
        )
        query = query.where(AIChatHistory.beneficiary_id.in_(subquery))
    
    count = await db.scalar(query) or 0
    
    return {"emergency_count": count, "days": days}
