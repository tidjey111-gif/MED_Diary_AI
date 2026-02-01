import { GoogleGenAI, Type } from "@google/genai";
import { PatientData } from "../types";

declare var process: {
  env: {
    API_KEY: string;
  };
};

export const generateDiaryText = async (data: PatientData): Promise<any> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API-ключ не найден.");
  }

  // FIX: Create instance with named parameter and use the latest recommended model for text generation
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Пациент: ${data.fullName}
    Диагноз: "${data.diagnosis}"
    Операция: ${data.surgeryDate}

    Сгенерируй 4 состояния для дневника (preOp, postOpStandard, postOpFinal, dischargeDay).
    
    КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать в тексте любые цифры АД, ЧСС, пульса, ЧД и температуры. 
    Программа вставит их автоматически. Если ты их напишешь, они продублируются.
    Пример ПЛОХОГО ответа: "АД 120/80 мм рт. ст., ЧСС 76 уд/мин. Состояние стабильное..."
    Пример ХОРОШЕГО ответа: "Состояние стабильное. Жалоб нет. Гемодинамика стабильная. Живот мягкий..."

    Для dischargeDay: Опиши снятие швов (если применимо), заживление раны первичным натяжением и рекомендации по амбулаторному лечению.
  `;

  try {
    // FIX: Always use ai.models.generateContent with 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Ты - врач-хирург. Пиши профессионально, сухо, по делу. Не используй вводные слова. В поле objectiveStatus описывай только статус (кожа, дыхание, живот), без цифр гемодинамики.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            preOp: {
              type: Type.OBJECT,
              properties: {
                complaints: { type: Type.STRING },
                objectiveStatus: { type: Type.STRING },
                localStatus: { type: Type.STRING },
                recommendations: { type: Type.STRING },
              },
              required: ["complaints", "objectiveStatus", "localStatus", "recommendations"],
            },
            postOpStandard: {
              type: Type.OBJECT,
              properties: {
                complaints: { type: Type.STRING },
                objectiveStatus: { type: Type.STRING },
                localStatus: { type: Type.STRING },
                recommendations: { type: Type.STRING },
              },
              required: ["complaints", "objectiveStatus", "localStatus", "recommendations"],
            },
            postOpFinal: {
              type: Type.OBJECT,
              properties: {
                complaints: { type: Type.STRING },
                objectiveStatus: { type: Type.STRING },
                localStatus: { type: Type.STRING },
                recommendations: { type: Type.STRING },
              },
              required: ["complaints", "objectiveStatus", "localStatus", "recommendations"],
            },
            dischargeDay: {
              type: Type.OBJECT,
              properties: {
                complaints: { type: Type.STRING },
                objectiveStatus: { type: Type.STRING },
                localStatus: { type: Type.STRING },
                recommendations: { type: Type.STRING },
              },
              required: ["complaints", "objectiveStatus", "localStatus", "recommendations"],
            },
          },
          required: ["preOp", "postOpStandard", "postOpFinal", "dischargeDay"],
        },
      },
    });

    // FIX: Correctly access the .text property of GenerateContentResponse
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Пустой ответ.");
  } catch (error) {
    console.error("GenAI Error:", error);
    throw error;
  }
};