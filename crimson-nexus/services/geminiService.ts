
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_API_KEY } from "../constants";
import { SymptomCheckResult, WearableData } from "../types";

// Initialize the client using process.env.API_KEY if available, otherwise fallback to constant
const apiKey = process.env.API_KEY || GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Helper to process Data URLs
const processDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], data: matches[2] };
  }
  // Fallback for some browser implementations of FileReader
  if (dataUrl.includes(',')) {
     const parts = dataUrl.split(',');
     const mimeMatch = parts[0].match(/:(.*?);/);
     return { 
       mimeType: mimeMatch ? mimeMatch[1] : 'application/octet-stream', 
       data: parts[1] 
     };
  }
  return null;
};

export const getGeminiChatResponse = async (
  history: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[],
  newMessage: string,
  attachmentUrl?: string,
  userCountry?: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct the new message part
    const newParts: any[] = [{ text: newMessage }];
    
    if (attachmentUrl) {
      const processed = processDataUrl(attachmentUrl);
      if (processed) {
        newParts.push({
          inlineData: {
            mimeType: processed.mimeType,
            data: processed.data
          }
        });
      }
    }

    const contextInstruction = userCountry 
      ? `You are assisting a user in ${userCountry}. Use local medical terminology, guidelines, and spelling where appropriate. ` 
      : "";

    const chat = ai.chats.create({
      model: model,
      history: history as any,
      config: {
        systemInstruction: `You are the Crimson Nexus AI Assistant. ${contextInstruction}You assist patients and providers. You CAN analyze medical images and listen to audio notes. If sent an image, describe it medically but do not diagnose. If sent audio, transcribe and respond. Be helpful, secure, and professional. You can offer smart reply suggestions at the end of your response in a format like [Suggestion 1] [Suggestion 2].`,
      }
    });

    const result: GenerateContentResponse = await chat.sendMessage({ 
      message: newParts
    });

    return result.text || "I apologize, I could not process that request.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I am having trouble processing that media. Please try again or use text.";
  }
};

export const analyzeMedicalLicense = async (base64DataUrl: string): Promise<{ valid: boolean; reasoning: string }> => {
  try {
    const processed = processDataUrl(base64DataUrl);
    if (!processed) throw new Error("Invalid image data");

    const prompt = `
      Analyze this image. Is this a valid medical doctor's license, certificate, or professional ID card? 
      Strictly return a JSON object with this format: { "valid": boolean, "reasoning": "short explanation" }.
      If it is a random image or not a medical document, set valid to false.
      Do not wrap the JSON in markdown code blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: processed.mimeType, 
              data: processed.data
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return { valid: false, reasoning: "AI Analysis failed to process image." };
  }
};

export const generateClinicalSummary = async (text: string, userCountry?: string): Promise<string> => {
  try {
    const context = userCountry ? `Context: User is in ${userCountry}. ` : "";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: `${context}Summarize the following clinical note or medical description into a concise, professional 1-sentence summary for a dashboard view: "${text}"` }]
      }
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini Summary Error", error);
    return "Summary unavailable.";
  }
};

export const performSymptomCheck = async (symptoms: string, userCountry?: string): Promise<SymptomCheckResult> => {
  try {
    const context = userCountry ? `The patient is in ${userCountry}. Provide advice relevant to this region's healthcare standards.` : "";
    const prompt = `
      Act as an advanced medical triage AI. ${context} Analyze these symptoms: "${symptoms}".
      Determine the most likely condition, severity level (LOW, MEDIUM, HIGH, CRITICAL), a brief recommendation, and any red flags.
      Return JSON only: { "condition": string, "severity": string, "recommendation": string, "redFlags": string[] }.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "{}";
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    return { condition: "Analysis Failed", severity: "LOW", recommendation: "Please consult a doctor manually.", redFlags: [] };
  }
};

export const checkMedicationInteractions = async (medications: string, userCountry?: string): Promise<string> => {
   try {
    const context = userCountry ? `Consider trade names and availability in ${userCountry}.` : "";
    const prompt = `
      Analyze this list of medications for potential interactions: "${medications}". ${context}
      Return a concise warning list or "No major interactions found."
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] }
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    return "Could not check interactions.";
  }
};

export const generateSOAPNote = async (input: string, userCountry?: string): Promise<{subjective: string, objective: string, assessment: string, plan: string}> => {
   try {
    const context = userCountry ? `Use medical conventions and spellings appropriate for ${userCountry}.` : "";
    const prompt = `
      Convert the following rough notes into a structured medical SOAP note (Subjective, Objective, Assessment, Plan).
      ${context}
      Notes: "${input}".
      Return JSON: { "subjective": string, "objective": string, "assessment": string, "plan": string }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "{}";
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    return { subjective: "", objective: "", assessment: "", plan: "Error generating SOAP note." };
  }
};

export const assessEmergencySituation = async (
  symptoms: string, 
  vitals?: WearableData,
  userCountry?: string
): Promise<{ severity: 'HIGH' | 'CRITICAL', actions: string[], assessment: string }> => {
  try {
    const context = userCountry ? `Patient is located in ${userCountry}. Recommend local emergency numbers (e.g., 911 vs 112 vs 999) and guidelines.` : "";
    const prompt = `
      EMERGENCY MODE ACTIVATED. ${context}
      Patient Symptoms: "${symptoms}".
      ${vitals ? `Vitals: HR ${vitals.heartRate}, BP ${vitals.bloodPressureSys}/${vitals.bloodPressureDia}, SpO2 ${vitals.spO2}%` : 'Vitals: Unknown'}
      
      Provide a rapid emergency assessment.
      1. Severity: Must be HIGH or CRITICAL.
      2. Immediate Actions: List 3 short, imperative steps for the user.
      3. Assessment: 1 sentence medical hypothesis.
      
      Return JSON: { "severity": "HIGH" | "CRITICAL", "actions": string[], "assessment": string }
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    return { severity: "HIGH", actions: ["Call Emergency Services immediately"], assessment: "AI Offline. Proceed with caution." };
  }
};

export const predictHealthRisks = async (historySummary: string, userCountry?: string): Promise<{ category: string, level: string, probability: number, prediction: string, steps: string[] }[]> => {
  try {
    const context = userCountry ? `Context: Patient in ${userCountry}. Consider regional health risks/epidemiology.` : "";
    const prompt = `
      Analyze this patient history for longitudinal health risks: "${historySummary}". ${context}
      Identify up to 3 potential future risks (e.g. Cardiac, Metabolic).
      Return JSON Array: [{ "category": "CARDIAC"|"METABOLIC"|"RESPIRATORY"|"MENTAL", "level": "LOW"|"MEDIUM"|"HIGH", "probability": number (0-100), "prediction": string, "steps": string[] }]
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || "[]";
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    return [];
  }
};
