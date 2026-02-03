import { simulateExtractMedicalData } from "./ai";
import { assessRisk } from "../utils/riskAssessment";
import { useStore } from "../store/useStore";

export async function runVoiceAgent(params: {
  transcript: string;
  beneficiaryId?: string;
}) {
  const { transcript, beneficiaryId } = params;

  const store = useStore.getState();
  const currentUser = store.currentUser;

  if (!currentUser) return;

  // 1️⃣ Extract structured data (AI mock / later real)
  const extracted = await simulateExtractMedicalData(transcript);

  // 2️⃣ Risk assessment (offline-safe)
  const risk = assessRisk(extracted);

  // 3️⃣ Create health log (LONG-TERM MEMORY)
  await store.addHealthLog({
    beneficiaryId: beneficiaryId || currentUser.id,
    date: new Date().toISOString(),
    bpSystolic: extracted?.bp?.split('/')?.[0],
    bpDiastolic: extracted?.bp?.split('/')?.[1],
    symptoms: extracted?.symptoms || [],
    mood: 'neutral',
    isEmergency: risk === 'high' || risk === 'critical',
  });

  // 4️⃣ Trigger SOS automatically if critical
  if (risk === 'critical') {
    await store.triggerSOS(beneficiaryId || currentUser.id);
  }

  // 5️⃣ Generate SAFE voice guidance
  const guidance =
    risk === 'critical'
      ? 'Yeh gambhir lag raha hai. Turant ASHA didi ya hospital se sampark karein.'
      : risk === 'high'
      ? 'Thodi saavdhani zaroori hai. Agar takleef badhe, ASHA didi ko batayein.'
      : 'Theek hai, main aapki baat note kar rahi hoon. Aaram karein.';

  return {
    risk,
    extracted,
    guidance,
  };
}
