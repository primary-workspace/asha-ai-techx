// Mock AI Service simulating OpenAI GPT-4o and Whisper
// In production, this would call the actual API endpoints

export const simulateVoiceToText = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("I visited Sunita today. Her blood pressure is 130 over 85. She is complaining of mild headache and fatigue. She looks a bit pale.");
    }, 2000);
  });
};

export const simulateExtractMedicalData = async (text: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        bpSystolic: 130,
        bpDiastolic: 85,
        symptoms: ["headache", "fatigue", "pallor"],
        mood: "tired",
        isEmergency: false
      });
    }, 1500);
  });
};

export const simulateHindiResponse = async (query: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("नमस्ते सुनीता। अपने खाने में हरी सब्जियां और दाल शामिल करें। अगर चक्कर आए तो तुरंत आशा दीदी को बुलाएं।");
    }, 1500);
  });
};
