import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Grade, MathProblem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateMathProblem(grade: Grade, topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<MathProblem> {
  const gradeCurriculum: Record<Grade, string> = {
    1: "Làm quen với các số tự nhiên, các phép tính cộng, trừ không nhớ trong phạm vi 100.",
    2: "Phép cộng, trừ có nhớ các số, bảng cửu chương nhân, chia, các phép tính cộng trừ không nhớ trong phạm vi 1000.",
    3: "Phép cộng, trừ các số có 3, 4 chữ số, phép nhân, chia với số có 1 chữ số có nhẩm và không nhẩm, làm quen với các số có 5 chữ số.",
    4: "Làm quen với các số có nhiều chữ số, phép nhân, chia với số có một hoặc nhiều chữ số, thực hiện các phép tính với phân số.",
    5: "Làm quen và các phép tính từ đơn giản đến phức tạp với số thập phân."
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Bạn là chuyên gia giáo dục tiểu học. Hãy tạo một bài toán cho học sinh lớp ${grade}.
    Kiến thức trọng tâm lớp ${grade}: ${gradeCurriculum[grade]}.
    Chủ đề cụ thể: ${topic}.
    Mức độ: ${difficulty}.
    
    Yêu cầu:
    1. Bài toán phải có bối cảnh vui nhộn, gần gũi (ví dụ: siêu anh hùng, thú cưng, kẹo bánh).
    2. Ngôn ngữ phù hợp với lứa tuổi lớp ${grade}.
    3. Đáp án phải là số nguyên (trừ khi là lớp 4-5 có thể dùng số thập phân/phân số đơn giản).
    4. Trả về định dạng JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Câu hỏi toán học dưới dạng một câu chuyện vui" },
          answer: { type: Type.NUMBER, description: "Đáp án đúng" },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.NUMBER },
            description: "4 lựa chọn bao gồm cả đáp án đúng"
          },
          explanation: { type: Type.STRING, description: "Giải thích ngắn gọn, dễ hiểu cho trẻ em" },
          difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
          topic: { type: Type.STRING }
        },
        required: ["question", "answer", "options", "explanation", "difficulty", "topic"]
      }
    }
  });

  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  const result = JSON.parse(jsonStr);
  return {
    ...result,
    id: Math.random().toString(36).substr(2, 9)
  };
}

export async function explainConcept(concept: string, grade: Grade): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Giải thích khái niệm "${concept}" cho một học sinh lớp ${grade} một cách cực kỳ đơn giản, vui nhộn và dễ hiểu. Sử dụng các ví dụ thực tế.`,
  });
  return response.text || "Xin lỗi, mình không thể giải thích lúc này.";
}

export async function generateSpeech(text: string, retries = 2): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Hãy đọc đoạn văn sau bằng giọng đọc tiếng Việt truyền cảm, vui vẻ, phù hợp cho trẻ em: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes("429") || error.status === "RESOURCE_EXHAUSTED")) {
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateSpeech(text, retries - 1);
    }
    if (!(error.message?.includes("429") || error.status === "RESOURCE_EXHAUSTED")) {
      console.error("Speech generation failed", error);
    }
    throw error;
  }
}
