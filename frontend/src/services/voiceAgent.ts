import apiClient from '../lib/api';
import { useStore } from '../store/useStore';

// Emergency keywords in Hindi and English
const EMERGENCY_KEYWORDS = [
    // Hindi
    'खून', 'bleeding', 'बहुत दर्द', 'तेज़ दर्द', 'severe pain',
    'behosh', 'बेहोश', 'unconscious', 'chakkar', 'चक्कर', 'dizzy',
    'bukhar', 'बुखार', 'fever', 'emergency', 'इमरजेंसी',
    'help', 'मदद', 'bachao', 'बचाओ', 'jaldi', 'जल्दी',
    'hospital', 'अस्पताल', 'doctor', 'डॉक्टर',
    // Danger signs
    'baby not moving', 'बच्चा नहीं हिल रहा', 'convulsion', 'दौरा',
    'water broke', 'पानी टूट गया', 'labour', 'प्रसव पीड़ा',
    'heavy bleeding', 'ज्यादा खून', 'can\'t breathe', 'सांस नहीं आ रही'
];

export interface TranscriptionResult {
    transcript: string;
    language: string;
    confidence?: number;
}

export interface ChatResponse {
    message: string;
    isEmergency: boolean;
    intent?: string;
    category?: string;
}

export interface VoiceAgentResult {
    transcript: string;
    response: string;
    language: string;
    isEmergency: boolean;
    extracted_data?: Record<string, unknown>;
    should_trigger_sos?: boolean;
}

// Check if message contains emergency keywords
function detectEmergency(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword.toLowerCase())
    );
}

/**
 * Transcribe audio using Whisper API (via backend)
 */
export async function transcribeAudio(
    audioBlob: Blob,
    language?: string
): Promise<TranscriptionResult> {
    const formData = new FormData();

    // Determine file extension based on blob type
    const mimeType = audioBlob.type || 'audio/webm';
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('ogg')) extension = 'ogg';

    formData.append('audio', audioBlob, `recording.${extension}`);

    if (language) {
        formData.append('language', language);
    }

    console.log('[VoiceAgent] Sending audio to transcription API...', {
        size: audioBlob.size,
        type: mimeType,
        language
    });

    const response = await apiClient.post('/voice/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    console.log('[VoiceAgent] Transcription result:', response.data);

    return {
        transcript: response.data.transcript || '',
        language: response.data.language || language || 'hi',
        confidence: response.data.confidence,
    };
}

/**
 * Get AI chat response from Gemini via backend
 */
export async function getChatResponse(
    message: string,
    language: string = 'hi',
    context?: string
): Promise<ChatResponse> {
    const isEmergency = detectEmergency(message);

    // If emergency detected, return immediate response
    if (isEmergency) {
        const emergencyResponse = language === 'hi'
            ? 'यह गंभीर लग रहा है। कृपया तुरंत अपनी ASHA दीदी को बुलाएं या नजदीकी अस्पताल जाएं। क्या आप ठीक हैं?'
            : 'This sounds serious. Please call your ASHA worker immediately or go to the nearest hospital. Are you okay?';

        return {
            message: emergencyResponse,
            isEmergency: true,
            intent: 'emergency',
            category: 'emergency'
        };
    }

    try {
        const response = await apiClient.post('/ai/health-query', {
            query: message,
            language,
            context,
        });

        return {
            message: response.data.guidance || response.data.message,
            isEmergency: false,
            intent: response.data.intent,
            category: response.data.category,
        };
    } catch (error) {
        console.error('[VoiceAgent] Chat API error:', error);
        const fallbackMessage = language === 'hi'
            ? 'माफ़ करें, अभी कुछ तकनीकी समस्या है। कृपया थोड़ी देर बाद कोशिश करें।'
            : 'Sorry, there is a technical issue. Please try again later.';

        return {
            message: fallbackMessage,
            isEmergency: false,
        };
    }
}

/**
 * Run full voice agent pipeline: Transcribe → Chat → Extract → Log
 */
export async function runVoiceAgent(params: {
    audioBlob?: Blob;
    transcript?: string;
    beneficiaryId?: string;
    language?: string;
}): Promise<VoiceAgentResult | null> {
    const { audioBlob, transcript: providedTranscript, beneficiaryId, language = 'hi' } = params;
    const store = useStore.getState();

    let transcript = providedTranscript || '';
    let detectedLanguage = language;

    // Step 1: Transcribe audio if provided
    if (audioBlob && !providedTranscript) {
        try {
            const transcriptionResult = await transcribeAudio(audioBlob, language);
            transcript = transcriptionResult.transcript;
            detectedLanguage = transcriptionResult.language;
        } catch (error) {
            console.error('[VoiceAgent] Transcription failed:', error);
            return null;
        }
    }

    if (!transcript || transcript.trim().length === 0) {
        console.warn('[VoiceAgent] No transcript available');
        return null;
    }

    // Step 2: Get AI chat response
    const chatResponse = await getChatResponse(transcript, detectedLanguage);

    // Step 3: Determine if this requires SOS trigger
    const shouldTriggerSOS = chatResponse.isEmergency && beneficiaryId;

    // Step 4: Log the interaction to database
    try {
        await apiClient.post('/voice/log', {
            user_message: transcript,
            ai_response: chatResponse.message,
            language_used: detectedLanguage,
            is_emergency: chatResponse.isEmergency,
            beneficiary_id: beneficiaryId,
            intent: chatResponse.intent,
            category: chatResponse.category,
        });
        console.log('[VoiceAgent] Interaction logged to database');
    } catch (error) {
        console.error('[VoiceAgent] Failed to log interaction:', error);
        // Don't fail the whole pipeline if logging fails
    }

    // Step 5: Trigger SOS if needed
    if (shouldTriggerSOS && beneficiaryId) {
        try {
            await store.triggerSOS(beneficiaryId);
            console.log('[VoiceAgent] SOS triggered for beneficiary:', beneficiaryId);
        } catch (error) {
            console.error('[VoiceAgent] Failed to trigger SOS:', error);
        }
    }

    return {
        transcript,
        response: chatResponse.message,
        language: detectedLanguage,
        isEmergency: chatResponse.isEmergency,
        should_trigger_sos: shouldTriggerSOS,
    };
}

/**
 * Get health advice using Gemini API
 */
export async function getHealthAdvice(
    query: string,
    language: string = 'hi'
): Promise<string> {
    try {
        const response = await getChatResponse(query, language);
        return response.message;
    } catch (error) {
        console.error('[VoiceAgent] Health advice error:', error);
        return language === 'hi'
            ? 'माफ़ करें, अभी जवाब देने में समस्या है। कृपया अपनी ASHA दीदी से संपर्क करें।'
            : 'Sorry, there is an issue getting a response. Please contact your ASHA worker.';
    }
}

/**
 * Extract structured visit data from voice transcription (for ASHA workers)
 */
export async function extractVisitData(
    transcription: string
): Promise<Record<string, unknown>> {
    try {
        const response = await apiClient.post('/ai/extract-visit-data', {
            transcription,
        });
        return response.data;
    } catch (error) {
        console.error('[VoiceAgent] Visit data extraction failed:', error);
        return {};
    }
}

export default {
    transcribeAudio,
    getChatResponse,
    runVoiceAgent,
    getHealthAdvice,
    extractVisitData,
};
