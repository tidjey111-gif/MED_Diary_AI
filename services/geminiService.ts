import { GoogleGenAI } from "@google/genai";
import { PatientData } from "../types";

export const generateDiaryText = async (data: PatientData): Promise<any> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API-ключ не найден. Убедитесь, что он настроен в среде выполнения.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    Ты - ассистент хирурга. Твоя задача - сгенерировать ТРИ шаблона состояния пациента для истории болезни.
    Отвечай ТОЛЬКО валидным JSON объектом. Никакого маркдауна.
    
    Структура JSON должна быть строго такой:
    {
      "preOp": { 
        "complaints": "Жалобы до операции", 
        "objectiveStatus": "Общий статус до операции (без цифр АД/ЧД)", 
        "localStatus": "Локальный статус до операции", 
        "recommendations": "Рекомендации до операции" 
      },
      "postOpStandard": { 
        "complaints": "Жалобы после операции (стабильные)", 
        "objectiveStatus": "Общий статус после операции",
        "localStatus": "Локальный статус (ранний п/о период)", 
        "recommendations": "Рекомендации п/о" 
      },
      "postOpFinal": { 
        "complaints": "Жалобы перед выпиской (улучшение)", 
        "objectiveStatus": "Общий статус перед выпиской",
        "localStatus": "Локальный статус (заживление)", 
        "recommendations": "Рекомендации при выписке" 
      }
    }
  `;

  const prompt = `
    Пациент:
    Диагноз: "${data.diagnosis}"
    Операция: ${data.surgeryDate}

    Сгенерируй 3 статических состояния:
    1. "preOp": Период от поступления до операции.
    2. "postOpStandard": Период после операции (основной этап лечения).
    3. "postOpFinal": Период перед выпиской (последние 2 дня, подготовка к выписке, швы сняты или спокойны).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Lower temperature for more consistent/conservative medical text
      },
    });

    if (response.text) {
      const text = response.text.trim();
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);

      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[2];
        try {
          return JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            throw new Error("Не удалось разобрать JSON, полученный от AI.");
        }
      } else {
         try {
            return JSON.parse(text);
         } catch(e) {
            console.error("Failed to parse raw text as JSON:", text);
            throw new Error("Ответ AI не является валидным JSON.");
         }
      }
    }
    return null;
  } catch (error) {
    console.error("GenAI Error:", error);
     if (error instanceof Error) {
        throw new Error(`Ошибка генерации: ${error.message}`);
    }
    throw new Error("Неизвестная ошибка при генерации.");
  }
};