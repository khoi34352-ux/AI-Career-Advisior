import { GoogleGenAI, Type } from "@google/genai";
import type { 
  AIResults, 
  SimulationPlan,
  SimulationReport,
  UserAnswer,
  AssessmentQuestion,
  AssessmentResult,
  LevelBasedSideHustle,
  SkillSet
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const cleanAndParseJSON = (text: string) => {
  try {
    let cleanText = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const startIdx = cleanText.indexOf('{');
    const endIdx = cleanText.lastIndexOf('}');
    const startArrIdx = cleanText.indexOf('[');
    const endArrIdx = cleanText.lastIndexOf(']');

    let finalIdxStart = -1;
    let finalIdxEnd = -1;

    if (startIdx !== -1 && (startArrIdx === -1 || startIdx < startArrIdx)) {
      finalIdxStart = startIdx;
      finalIdxEnd = endIdx;
    } else if (startArrIdx !== -1) {
      finalIdxStart = startArrIdx;
      finalIdxEnd = endArrIdx;
    }

    if (finalIdxStart !== -1 && finalIdxEnd !== -1) {
      cleanText = cleanText.substring(finalIdxStart, finalIdxEnd + 1);
    }
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("JSON Parse Error:", text);
    throw new Error("AI trả về định dạng dữ liệu không hợp lệ.");
  }
};

export const getNextQuestion = async (
  history: any[],
  branch: string,
  isFastMode: boolean
): Promise<{ nextQuestion: string; options?: string[]; isComplete: boolean }> => {
  const model = isFastMode ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
  const userTurns = history.filter(m => m.sender === 'user').length;
  
  let strategy = "";
  if (userTurns < 3) strategy = "Khai thác nhóm Realistic (R) và Investigative (I).";
  else if (userTurns < 6) strategy = "Khai thác nhóm Artistic (A) và Social (S).";
  else if (userTurns < 9) strategy = "Khai thác nhóm Enterprising (E) và Conventional (C).";
  else strategy = "Xác nhận nhóm mã Holland chiếm ưu thế nhất.";

  const systemInstruction = `Bạn là Chuyên gia Tâm lý Hướng nghiệp. Nhiệm vụ của bạn là dẫn dắt người dùng qua tối đa 12 câu hỏi để xác định mã Holland (RIASEC).
LƯỢT HIỆN TẠI: ${userTurns + 1}/12.
CHIẾN THUẬT: ${strategy}
YÊU CẦU:
1. Đừng hỏi trực tiếp về mã Holland. Hãy hỏi về hành động, sở thích hoặc tình huống thực tế.
2. Trả về JSON: { "nextQuestion": "string", "options": ["string"], "isComplete": boolean }
3. Nếu đã đủ 12 lượt hoặc người dùng bộc lộ rõ ràng thiên hướng, hãy đặt isComplete = true.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: "Lịch sử hội thoại:\n" + JSON.stringify(history) }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nextQuestion: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          isComplete: { type: Type.BOOLEAN }
        },
        required: ["nextQuestion", "isComplete"]
      }
    }
  });

  return cleanAndParseJSON(response.text);
};

export const getCareerAdvice = async (history: any[], branch: string): Promise<AIResults> => {
  const prompt = `
    Dựa trên lịch sử hội thoại: ${JSON.stringify(history)}
    
    HÃY THỰC HIỆN PHÂN TÍCH HƯỚNG NGHIỆP SIÊU CÁ NHÂN HÓA:
    1. Phân tích mã Holland (RIASEC) chi tiết (0-10 điểm).
    2. Đề xuất 3 nghề nghiệp. Với mỗi nghề, Sơ đồ tư duy (Mind Map) PHẢI CỤ THỂ:
       - Giai đoạn 1 (Nền tảng): Liệt kê các môn học/kỹ năng dựa trên sở thích cá nhân đã nêu trong hội thoại.
       - Giai đoạn 2 (Thực thi): Đề xuất ít nhất 1 dự án thực tế hoặc chứng chỉ cụ thể.
       - Giai đoạn 3 (Kỹ năng mềm): Cách khắc phục điểm yếu của người dùng này.
       - Giai đoạn 4 (Thị trường): Vị trí công việc cụ thể và dự báo tiềm năng 5 năm tới.
    3. Trích xuất thông tin thị trường: Nhu cầu tuyển dụng, Mức lương khởi điểm tại VN, MatchRate (%).

    YÊU CẦU NGÔN NGỮ: Tiếng Việt, chuyên nghiệp, truyền cảm hứng.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedCareers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                career: { type: Type.STRING },
                reason: { type: Type.STRING },
                matchRate: { type: Type.NUMBER },
                incomeReference: { type: Type.STRING },
                universities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      region: { type: Type.STRING },
                      admissionScore: { type: Type.STRING }
                    }
                  }
                },
                mindmap: {
                  type: Type.OBJECT,
                  properties: {
                    center: { type: Type.STRING },
                    branches: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          items: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          hollandAnalysis: {
            type: Type.OBJECT,
            properties: {
              scores: {
                type: Type.OBJECT,
                properties: {
                  R: { type: Type.NUMBER }, I: { type: Type.NUMBER }, A: { type: Type.NUMBER },
                  S: { type: Type.NUMBER }, E: { type: Type.NUMBER }, C: { type: Type.NUMBER }
                }
              },
              primaryCode: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          },
          skills: {
            type: Type.OBJECT,
            properties: {
              hardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              softSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          finalMotivation: { type: Type.STRING },
          supportiveAdvice: { type: Type.STRING }
        }
      }
    }
  });

  return cleanAndParseJSON(response.text);
};

export const startSimulation = async (career: string): Promise<SimulationPlan> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Tạo kịch bản mô phỏng thực tế cho nghề: ${career}. Gồm giới thiệu và 3 nhiệm vụ.` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          career: { type: Type.STRING },
          introduction: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['multiple-choice', 'text-input'] },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    }
  });
  return cleanAndParseJSON(response.text);
};

export const evaluateSimulation = async (career: string, answers: UserAnswer[]): Promise<SimulationReport> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Đánh giá năng lực dựa trên các câu trả lời mô phỏng cho nghề ${career}: ${JSON.stringify(answers)}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strengths: { type: Type.STRING },
          improvements: { type: Type.STRING },
          competencySummary: {
            type: Type.OBJECT,
            properties: {
              criticalThinking: { type: Type.NUMBER },
              professionalSkills: { type: Type.NUMBER },
              communication: { type: Type.NUMBER },
              adaptability: { type: Type.NUMBER }
            }
          },
          developmentSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          refinedRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return cleanAndParseJSON(response.text);
};

export const generateAssessment = async (career: string, level: string): Promise<AssessmentQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Tạo 5 câu hỏi trắc nghiệm kiểm tra kiến thức nghề ${career} ở trình độ ${level}.` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }
  });
  return cleanAndParseJSON(response.text);
};

export const evaluateAssessment = async (career: string, answers: {question: string, answer: string}[]): Promise<AssessmentResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Chấm điểm và đánh giá trình độ cho nghề ${career} dựa trên: ${JSON.stringify(answers)}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
          levelVietnamese: { type: Type.STRING },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        }
      }
    }
  });
  return cleanAndParseJSON(response.text);
};

export const generateLevelBasedSideHustles = async (career: string, level: string, skills: SkillSet): Promise<LevelBasedSideHustle[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Gợi ý 3 cách kiếm tiền (side hustles) thực tế cho nghề ${career} ở trình độ ${level} với bộ kỹ năng: ${JSON.stringify(skills)}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Freelance', 'Self-marketing'] },
            actionPlan: { type: Type.STRING },
            estimatedIncome: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    }
  });
  return cleanAndParseJSON(response.text);
};
