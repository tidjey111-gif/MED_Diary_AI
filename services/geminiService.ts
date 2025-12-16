import { GoogleGenAI, Type } from "@google/genai";
import { PatientData } from "../types";

export const generateDiaryText = async (data: PatientData): Promise<any> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API-ключ не найден. Убедитесь, что он настроен в среде выполнения.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Пациент:
    Диагноз: "${data.diagnosis}"
    Операция: ${data.surgeryDate}

    Сгенерируй 3 статических состояния для медицинского дневника хирурга:
    1. "preOp": Период от поступления до операции.
    2. "postOpStandard": Период после операции (основной этап лечения, 1-3 сутки).
    3. "postOpFinal": Период перед выпиской (удовлетворительное состояние, подготовка к выписке).
    
    Используй профессиональную медицинскую терминологию на русском языке. Жалобы и статус должны соответствовать диагнозу и срокам.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Ты - опытный лечащий врач хирургического отделения. Твоя задача - формулировать лаконичные и грамотные записи для истории болезни. Избегай воды.",
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
          },
          required: ["preOp", "postOpStandard", "postOpFinal"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Получен пустой ответ от модели.");
  } catch (error) {
    console.error("GenAI Error:", error);
     if (error instanceof Error) {
        throw new Error(`Ошибка генерации: ${error.message}`);
    }
    throw new Error("Неизвестная ошибка при генерации.");
  }
};