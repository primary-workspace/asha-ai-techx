import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, X, Volume2, Send, Square, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useStore } from '../store/useStore';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { runVoiceAgent, getHealthAdvice } from '../services/voiceAgent';

interface VoiceAssistantProps {
    customTrigger?: (onClick: () => void, isActive: boolean) => React.ReactNode;
    mode?: 'beneficiary' | 'asha' | 'auto';
    beneficiaryId?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    isEmergency?: boolean;
    timestamp: Date;
}

type AssistantMode = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VoiceAssistant({
    customTrigger,
    mode = 'auto',
    beneficiaryId
}: VoiceAssistantProps) {
    const { currentUser, language } = useStore();

    const [isOpen, setIsOpen] = useState(false);
    const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { state: recorderState, startRecording, stopRecording, resetRecording } = useVoiceRecorder();
    const { speak, stop: stopSpeaking, state: ttsState } = useTextToSpeech(language === 'hi' ? 'hi-IN' : 'en-US');

    // Determine effective mode based on user role
    const effectiveMode = mode === 'auto'
        ? currentUser?.role === 'asha_worker' ? 'asha' : 'beneficiary'
        : mode;

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Update assistant mode based on TTS state
    useEffect(() => {
        if (ttsState.isSpeaking) {
            setAssistantMode('speaking');
        } else if (assistantMode === 'speaking') {
            setAssistantMode('idle');
        }
    }, [ttsState.isSpeaking, assistantMode]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        const welcomeMessage = effectiveMode === 'asha'
            ? 'Namaste! I\'m your ASHA AI assistant. How can I help you today? You can ask me about patient care, record visit notes, or get health guidance.'
            : language === 'hi'
                ? 'नमस्ते! मैं आपकी आशा दीदी हूं। आप मुझसे कुछ भी पूछ सकते हैं - स्वास्थ्य, डाइट, या प्रेगनेंसी के बारे में।'
                : 'Hello! I\'m your Asha Didi. You can ask me anything about health, diet, or pregnancy.';

        setMessages([{
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
        }]);
    }, [effectiveMode, language]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setAssistantMode('idle');
        setMessages([]);
        setInputText('');
        stopSpeaking();
        resetRecording();
    }, [stopSpeaking, resetRecording]);

    const handleStartRecording = useCallback(async () => {
        if (recorderState.isRecording) return;

        stopSpeaking();
        await startRecording();
        setAssistantMode('listening');
    }, [recorderState.isRecording, startRecording, stopSpeaking]);

    const handleStopRecording = useCallback(async () => {
        if (!recorderState.isRecording) return;

        const audioBlob = await stopRecording();
        if (!audioBlob) {
            setAssistantMode('idle');
            return;
        }

        setAssistantMode('processing');

        try {
            // Process audio through voice agent
            const result = await runVoiceAgent({
                audioBlob,
                beneficiaryId,
                language,
            });

            if (result) {
                // Add user message
                setMessages(prev => [...prev, {
                    role: 'user',
                    content: result.transcript,
                    timestamp: new Date(),
                }]);

                // Add AI response
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.response,
                    isEmergency: result.isEmergency,
                    timestamp: new Date(),
                }]);

                // Speak the response
                speak(result.response);
            } else {
                // Failed to process
                const errorMsg = language === 'hi'
                    ? 'माफ़ करें, आवाज़ समझ नहीं आई। कृपया फिर से बोलें।'
                    : 'Sorry, I couldn\'t understand that. Please try again.';

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: errorMsg,
                    timestamp: new Date(),
                }]);
                speak(errorMsg);
            }
        } catch (error) {
            console.error('[VoiceAssistant] Error:', error);
            const errorMsg = language === 'hi'
                ? 'कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।'
                : 'Something went wrong. Please try again.';

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMsg,
                timestamp: new Date(),
            }]);
            setAssistantMode('idle');
        }
    }, [recorderState.isRecording, stopRecording, beneficiaryId, language, speak]);

    const handleTextSubmit = useCallback(async () => {
        if (!inputText.trim() || assistantMode === 'processing') return;

        const userMessage = inputText.trim();
        setInputText('');

        // Add user message
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        }]);

        setAssistantMode('processing');
        stopSpeaking();

        try {
            const response = await getHealthAdvice(userMessage, language);

            // Add AI response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            }]);

            // Speak the response
            speak(response);

        } catch (error) {
            console.error('[VoiceAssistant] Error:', error);
            const errorMsg = language === 'hi'
                ? 'माफ़ करें, कुछ गड़बड़ हो गई।'
                : 'Sorry, something went wrong.';

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMsg,
                timestamp: new Date(),
            }]);
            setAssistantMode('idle');
        }
    }, [inputText, assistantMode, language, speak, stopSpeaking]);

    const handleMicClick = useCallback(() => {
        if (!isOpen) {
            handleOpen();
            return;
        }

        if (recorderState.isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    }, [isOpen, recorderState.isRecording, handleOpen, handleStartRecording, handleStopRecording]);

    const quickActions = effectiveMode === 'asha' ? [
        { label: 'BP Guidelines', query: 'What are normal BP ranges for pregnant women?' },
        { label: 'Danger Signs', query: 'What are the danger signs in pregnancy?' },
        { label: 'ANC Schedule', query: 'What is the recommended ANC visit schedule?' },
    ] : [
        { label: 'आहार सलाह', query: 'गर्भावस्था में क्या खाना चाहिए?' },
        { label: 'खतरे के संकेत', query: 'प्रेगनेंसी में किन लक्षणों पर ध्यान देना चाहिए?' },
        { label: 'व्यायाम', query: 'गर्भावस्था में कौन से व्यायाम सुरक्षित हैं?' },
    ];

    const handleQuickAction = useCallback((query: string) => {
        setInputText(query);
        setTimeout(() => handleTextSubmit(), 100);
    }, [handleTextSubmit]);

    // Recording duration display
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-x-4 bottom-24 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col max-h-[70vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                    effectiveMode === 'asha' ? "bg-teal-100 dark:bg-teal-900/30" : "bg-rose-100 dark:bg-rose-900/30"
                                )}>
                                    <img
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Asha&backgroundColor=f472b6"
                                        alt="Asha"
                                        className="w-10 h-10"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">
                                        {effectiveMode === 'asha' ? 'ASHA Assistant' : 'आशा दीदी'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {assistantMode === 'listening'
                                            ? `🎤 Recording... ${formatDuration(recorderState.duration)}`
                                            : assistantMode === 'processing'
                                                ? '🤔 Processing...'
                                                : assistantMode === 'speaking'
                                                    ? '🔊 Speaking...'
                                                    : 'AI Health Assistant'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx(
                                        "max-w-[85%] p-3 rounded-2xl",
                                        msg.role === 'user'
                                            ? "ml-auto bg-teal-500 text-white rounded-br-md"
                                            : msg.isEmergency
                                                ? "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 rounded-bl-md"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                                    )}
                                >
                                    {msg.isEmergency && (
                                        <div className="flex items-center gap-1 text-red-600 mb-1">
                                            <AlertTriangle size={14} />
                                            <span className="text-xs font-bold">Emergency</span>
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                </motion.div>
                            ))}

                            {assistantMode === 'processing' && (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">
                                        {language === 'hi' ? 'सोच रही हूं...' : 'Thinking...'}
                                    </span>
                                </div>
                            )}

                            {/* Recording indicator */}
                            {assistantMode === 'listening' && (
                                <div className="flex items-center justify-center gap-2 py-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 bg-rose-500 rounded-full"
                                                animate={{ height: [8, 24, 8] }}
                                                transition={{
                                                    duration: 0.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.1,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-rose-500 font-medium text-sm ml-2">
                                        {formatDuration(recorderState.duration)}
                                    </span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions (shown when idle with only welcome message) */}
                        {messages.length === 1 && assistantMode === 'idle' && (
                            <div className="px-4 pb-2">
                                <p className="text-xs text-slate-400 mb-2 font-medium">
                                    {language === 'hi' ? 'जल्दी सवाल:' : 'Quick questions:'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {quickActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuickAction(action.query)}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                                    placeholder={effectiveMode === 'asha' ? "Type your question..." : "अपना सवाल लिखें..."}
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                    disabled={assistantMode === 'processing' || assistantMode === 'listening'}
                                />

                                <button
                                    onClick={handleTextSubmit}
                                    disabled={!inputText.trim() || assistantMode === 'processing' || assistantMode === 'listening'}
                                    className="w-12 h-12 bg-teal-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
                                >
                                    <Send size={20} />
                                </button>

                                <button
                                    onClick={handleMicClick}
                                    disabled={assistantMode === 'processing'}
                                    className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                        recorderState.isRecording
                                            ? "bg-red-500 text-white animate-pulse"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                    )}
                                >
                                    {recorderState.isRecording ? <Square size={20} /> : <Mic size={20} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            {customTrigger ? (
                customTrigger(handleMicClick, isOpen || recorderState.isRecording || ttsState.isSpeaking)
            ) : (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMicClick}
                    className={clsx(
                        "fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl flex items-center justify-center z-50 transition-colors",
                        recorderState.isRecording
                            ? "bg-red-500 animate-pulse"
                            : ttsState.isSpeaking
                                ? "bg-green-500"
                                : isOpen
                                    ? "bg-teal-600"
                                    : effectiveMode === 'asha'
                                        ? "bg-teal-600 hover:bg-teal-700"
                                        : "bg-rose-600 hover:bg-rose-700"
                    )}
                >
                    {ttsState.isSpeaking ? (
                        <Volume2 className="text-white w-8 h-8" />
                    ) : recorderState.isRecording ? (
                        <Square className="text-white w-8 h-8" />
                    ) : (
                        <Mic className="text-white w-8 h-8" />
                    )}
                </motion.button>
            )}
        </>
    );
}
