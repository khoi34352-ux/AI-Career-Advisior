import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { AIResults, SimulationPlan, SimulationReport, UserAnswer } from '../types';
import type { ConversationBranch } from '../App';
import type { Message } from '../components/ChatInterface';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
  if (!text) return null;
  try {
    // The TTS model expects a prompt that instructs it what to say.
    // Simply passing the raw text can lead to errors.
    const ttsPrompt = `Say: ${text}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Using a calm and professional voice
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("❌ Lỗi khi tạo giọng nói:", error);
    throw error;
  }
};


export const getNextQuestion = async (
  history: Message[],
  branch: ConversationBranch,
  isFastMode: boolean
): Promise<{ nextQuestion: string; options: string[]; isComplete: boolean }> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
  const model = isFastMode ? 'gemini-flash-lite-latest' : 'gemini-2.5-flash';
  const personaPrompt = `Bạn là AI Career Advisor – một chatbot hướng nghiệp thông minh và thấu cảm, kết hợp phương pháp tư vấn và trị liệu tâm lý. Vai trò của bạn là trò chuyện với học sinh THPT để hiểu sâu về họ, từ đó đưa ra lời khuyên nghề nghiệp tốt nhất.

**Giọng điệu:** Luôn nhẹ nhàng, đồng cảm, khích lệ, và không phán xét.

**Quy trình cốt lõi:**
Dựa vào **nhánh hội thoại ('branch')** được cung cấp và **lịch sử trò chuyện**, bạn sẽ đi theo 1 trong 2 luồng sau:

**LUỒNG 1: Nếu nhánh là 'no_direction' (người dùng CHƯA CÓ định hướng)**
Mục tiêu: Khảo sát tâm lý sâu.
Chủ đề cần khai thác (hỏi tuần tự, mỗi lần một chủ đề):
1. Sở thích cá nhân, đam mê tiềm ẩn.
2. Nỗi sợ, rào cản tâm lý khi chọn nghề.
3. Mong muốn về môi trường làm việc, phong cách sống.
4. Kỳ vọng về thu nhập, danh tiếng, sự ổn định.
5. Các giá trị cá nhân (tự do, sáng tạo, an toàn, cống hiến, học hỏi,...).

**LUỒNG 2: Nếu nhánh là 'has_direction' (người dùng ĐÃ CÓ định hướng)**
Mục tiêu: Khảo sát tâm lý rút gọn, tập trung vào lựa chọn hiện tại.
Chủ đề cần khai thác (hỏi tuần tự):
1. Mức độ tự tin và kiên định với lựa chọn.
2. Động lực thật sự phía sau quyết định.
3. Những lo lắng, rủi ro tiềm ẩn và cách bạn có thể giúp họ.

**YÊU CẦU QUAN TRỌNG VỀ ĐỊNH DẠNG PHẢN HỒI:**
1.  **Hỏi từng câu một:** Luôn chỉ đặt một câu hỏi tại một thời điểm.
2.  **Tạo lựa chọn:** Với MỖI câu hỏi bạn đặt ra, hãy tạo ra 3-5 lựa chọn trả lời gợi ý (options). Các lựa chọn này phải đa dạng và sâu sắc.
3.  **Linh hoạt:** Dựa vào lịch sử trò chuyện để làm cho câu hỏi và các lựa chọn trở nên tự nhiên, không máy móc. Sử dụng khả năng tìm kiếm và suy luận của bạn để làm câu hỏi thông minh hơn.
4.  **Độ sâu:** Mục tiêu của bạn là có một cuộc trò chuyện sâu sắc. Đừng vội kết thúc. Hãy đặt mục tiêu hỏi từ 8-12 câu hỏi để có đủ dữ liệu.
5.  **Kết thúc:** Khi bạn cảm thấy đã có đủ thông tin (sau khoảng 8-12 câu hỏi), hãy đặt \`isComplete\` thành \`true\`.
6.  **Luôn trả lời bằng một đối tượng JSON DUY NHẤT** có cấu trúc:
    {
      "nextQuestion": "câu hỏi tiếp theo của bạn ở đây",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3"],
      "isComplete": false
    }`;

    const historyString = history
    .map(msg => {
        let contentText = '';
        if (typeof msg.content === 'string') {
            contentText = msg.content;
        } else if (msg.content && typeof msg.content === 'object' && 'props' in msg.content) {
            const children = (msg.content as any).props.children;
            const parts = Array.isArray(children) ? children : [children];

            for (const part of parts) {
                if (part && typeof part === 'object' && part.props && part.props.children) {
                    if (Array.isArray(part.props.children)) {
                        contentText += `[${part.props.children.length} hình ảnh đính kèm] `;
                    } else {
                        contentText += part.props.children;
                    }
                }
            }
        } else {
            contentText = String(msg.content);
        }
        return `${msg.sender === 'ai' ? 'AI' : 'User'}: ${contentText}`;
    })
    .join('\n');

  const finalPrompt = `${personaPrompt}\n\n**Bối cảnh hiện tại:**\n- Nhánh hội thoại: ${branch}\n- Lịch sử trò chuyện:\n${historyString}\n\n**Nhiệm vụ: Dựa vào bối cảnh, tạo ra câu hỏi tiếp theo và các lựa chọn, hoặc quyết định kết thúc.**`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                nextQuestion: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                isComplete: { type: Type.BOOLEAN },
            },
            required: ['nextQuestion', 'options', 'isComplete'],
        }
      },
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("❌ Lỗi khi lấy câu hỏi tiếp theo:", error);
    throw error;
  }
};


export const getCareerAdvice = async (history: Message[], branch: ConversationBranch): Promise<AIResults> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
  const historyString = history
      .map(msg => {
          let contentText = '';
          if (typeof msg.content === 'string') {
              contentText = msg.content;
          } else if (msg.content && typeof msg.content === 'object' && 'props' in msg.content) {
              // Fix: Cast msg.content to any to access props.children and robustly extract text/image info.
              const children = (msg.content as any).props.children;
              const parts = Array.isArray(children) ? children : [children];

              for (const part of parts) {
                  if (part && typeof part === 'object' && part.props && part.props.children) {
                      if (Array.isArray(part.props.children)) {
                          contentText += `[${part.props.children.length} hình ảnh đính kèm] `;
                      } else {
                          contentText += part.props.children;
                      }
                  }
              }
          } else {
              contentText = String(msg.content);
          }
          return `${msg.sender === 'ai' ? 'AI' : 'User'}: ${contentText}`;
      })
      .join('\n');
      
  const personaPrompt = `Bạn là AI Career Advisor – Trợ lý AI hướng nghiệp & tâm lý học tích hợp chuyên nghiệp. 

**Phương pháp làm việc của bạn:**
1. **Thu thập thông tin cập nhật:**
   - Xu hướng thị trường lao động Việt Nam hiện tại
   - Nhu cầu tuyển dụng theo ngành nghề
   - Mức lương trung bình và triển vọng phát triển
   - Các trường đại học uy tín và điểm chuẩn của năm tuyển sinh gần nhất.
   - Kỹ năng đang được săn đón bởi nhà tuyển dụng

2. **Áp dụng phương pháp chuyên gia hướng nghiệp:**
   - **Holland Code (RIASEC):** Phân tích tính cách qua 6 nhóm: Realistic, Investigative, Artistic, Social, Enterprising, Conventional
   - **Theory of Work Adjustment:** Đánh giá sự phù hợp giữa khả năng, giá trị cá nhân và yêu cầu công việc
   - **Social Cognitive Career Theory:** Xem xét niềm tin về bản thân, kỳ vọng kết quả và mục tiêu cá nhân
   - **Phân tích SWOT cá nhân:** Điểm mạnh, điểm yếu, cơ hội và thách thức

3. **Phong cách:** Thân thiện, thấu hiểu, dựa trên dữ liệu thực tế và phương pháp khoa học.`;

  const finalMotivationPrompt = `
  **Giai đoạn cuối: Phản hồi cảm xúc & động viên**
  Phân tích trạng thái tâm lý của người dùng qua cuộc trò chuyện và viết lời nhắn chân thành vào thuộc tính 'finalMotivation' của JSON:
  - **Tự tin:** Chúc mừng và truyền cảm hứng tiếp tục
  - **Lo âu:** Động viên thực tế, khẳng định nỗi sợ là bình thường
  - **Mất phương hướng:** Đồng cảm sâu sắc, khẳng định việc tìm kiếm là bước đầu quan trọng
  `;

  let analysisRequest = `**Yêu cầu phân tích:**
Dựa vào toàn bộ nội dung cuộc trò chuyện bên dưới và sử dụng Google Search để lấy dữ liệu mới nhất, hãy thực hiện phân tích chuyên sâu và trả về kết quả dưới dạng một đối tượng JSON DUY NHẤT.

**Toàn bộ cuộc trò chuyện:**
${historyString}

---

**BƯỚC 1: SỬ DỤNG GOOGLE SEARCH (QUAN TRỌNG)**
Tìm kiếm thông tin mới nhất trên web để đảm bảo các đề xuất là chính xác và cập nhật, ví dụ: "xu hướng nghề nghiệp Việt Nam 2025", "điểm chuẩn đại học năm gần nhất", "lương ngành ABC",...

**BƯỚC 2: PHÂN TÍCH THEO PHƯƠNG PHÁP CHUYÊN GIA**
Phân tích cuộc trò chuyện để xác định Holland Code, SWOT, giá trị cá nhân, v.v.

**BƯỚC 3: XUẤT KẾT QUẢ JSON**
Tạo một đối tượng JSON duy nhất với các thuộc tính sau:
1. **recommendedCareers:** Một mảng chứa 3-5 đối tượng nghề nghiệp. Mỗi đối tượng có cấu trúc:
   - \`career\`: (string) Tên ngành nghề
   - \`reason\`: (string) Lý do chi tiết tại sao ngành này phù hợp, kết nối trực tiếp với nội dung cuộc trò chuyện và phân tích ở Bước 2.
   - \`universities\`: (array) Mảng chứa 2-3 đối tượng trường đại học, mỗi đối tượng có: \`name\` (string), \`region\` (string), \`admissionScore\` (string, từ kết quả tìm kiếm, bắt buộc phải ghi rõ năm áp dụng, ví dụ: "25.5 (năm 2024)").

2. **mindmap:** Một đối tượng sơ đồ tư duy với cấu trúc:
   - \`center\`: (string) Dựa trên định hướng của người dùng ("Lộ trình Khám phá Bản thân" hoặc "Lộ trình Chinh phục [Tên ngành]")
   - \`branches\`: (array) Mảng chứa đúng 3 đối tượng nhánh, với tiêu đề và nội dung phù hợp với từng giai đoạn phát triển. **MỖI NHÁNH PHẢI CÓ:**
     - \`title\`: (string) Tiêu đề của giai đoạn. Ví dụ: "Giai đoạn 1 - Nền tảng & Tự khám phá (6 tháng đầu)".
     - \`items\`: (array) **BẮT BUỘC** là một mảng chứa 3-4 chuỗi (string) là các hành động hoặc kỹ năng cụ thể cần phát triển trong giai đoạn đó. Ví dụ: ["Tìm hiểu các khóa học online về A", "Tham gia CLB B", "Đọc sách về C"].

3. **simulations:** Một mảng chứa 2-3 đối tượng mô phỏng nghề nghiệp. Mỗi đối tượng có cấu trúc:
   - \`career\`: (string) Tên ngành nghề (lấy từ một trong các ngành đã đề xuất)
   - \`introduction\`: (string) Đoạn mở đầu hấp dẫn mô tả ngày làm việc đầu tiên.
   - \`question\`: (string) Câu hỏi tình huống.
   - \`choices\`: (array) Mảng chứa 2 đối tượng lựa chọn, mỗi đối tượng có \`text\` (string) và \`nextPrompt\` (string).
   
4. **incomeReference:** (string) Dựa trên Google Search, tóm tắt một cách thực tế mức thu nhập tham khảo (ví dụ: mức lương khởi điểm, mức lương trung bình) và tiềm năng tài chính cho các ngành nghề đã đề xuất.

5. **supportiveAdvice:** (string) Viết một đoạn văn ngắn gọn (2-4 câu) nhưng sâu sắc và đồng cảm, đưa ra lời khuyên cho phụ huynh về cách họ có thể hỗ trợ con mình tốt nhất dựa trên kết quả phân tích tâm lý từ cuộc trò chuyện.
   
${finalMotivationPrompt}

**YÊU CẦU ĐỊNH DẠNG JSON (CỰC KỲ QUAN TRỌNG):**
- **TOÀN BỘ PHẢN HỒI** của bạn phải là một chuỗi JSON duy nhất, hợp lệ.
- **KHÔNG** được phép có bất kỳ văn bản, giải thích, hay ghi chú nào bên ngoài đối tượng JSON.
- Phản hồi phải bắt đầu bằng \`{\` và kết thúc bằng \`}\`.
- **KHÔNG** sử dụng markdown code block (ví dụ: \`\`\`json ... \`\`\`).
- **BẮT BUỘC** sử dụng dấu ngoặc kép (") cho tất cả các khóa (keys) và giá trị chuỗi (string values). Tuyệt đối không dùng dấu ngoặc đơn (').
- **KHÔNG** được để dấu phẩy thừa (trailing comma) ở cuối các mảng (arrays) hoặc đối tượng (objects).`;
  
  const finalPrompt = `${personaPrompt}\n\n${analysisRequest}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: finalPrompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    let jsonText = response.text.trim();
    
    // More robust JSON extraction
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
    } else if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    }
    
    const result = JSON.parse(jsonText);
    
    console.log("✅ AI đã hoàn thành phân tích");
    
    return result;
  } catch (error) {
    console.error("❌ Lỗi khi gọi API:", error);
    if (error instanceof SyntaxError) {
        console.error("Lỗi parse JSON. Phản hồi từ AI có thể không đúng định dạng.");
    }
    throw error;
  }
};


export const startSimulation = async (career: string): Promise<SimulationPlan> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
  const prompt = `Bạn là một nhà thiết kế kịch bản mô phỏng nghề nghiệp.
Nhiệm vụ của bạn là tạo ra một chuỗi các tình huống thực tế cho ngành nghề: "${career}".

YÊU CẦU:
1.  **Tạo một Lời giới thiệu (introduction):** Ngắn gọn, hấp dẫn, đặt người dùng vào vai một nhân viên mới trong ngành.
2.  **Tạo một chuỗi gồm 3 đến 4 nhiệm vụ (tasks):**
    *   Các nhiệm vụ phải phản ánh công việc thực tế của ngành "${career}".
    *   Độ khó tăng dần.
    *   Mỗi nhiệm vụ phải có một trong hai loại (type):
        *   \`multiple-choice\`: Đưa ra tình huống và 2-3 lựa chọn (\`options\`) để giải quyết.
        *   \`text-input\`: Đưa ra tình huống và yêu cầu người dùng viết phản hồi ngắn.
3.  **Định dạng:** Trả về một đối tượng JSON DUY NHẤT, không có markdown.

Ví dụ cho ngành "Chuyên viên Nhân sự":
{
  "career": "Chuyên viên Nhân sự",
  "introduction": "Chào mừng bạn đến với vai trò Chuyên viên Nhân sự tại một công ty công nghệ năng động! Nhiệm vụ đầu tiên của bạn là...",
  "tasks": [
    { "description": "Một nhân viên phàn nàn về khối lượng công việc. Bạn sẽ chọn cách tiếp cận nào đầu tiên?", "type": "multiple-choice", "options": ["Lắng nghe và ghi nhận ý kiến.", "Yêu cầu họ trình bày bằng văn bản.", "Báo cáo ngay cho quản lý trực tiếp."] },
    { "description": "Bạn cần soạn một email thông báo về chính sách làm việc tại nhà mới. Hãy viết nội dung chính của email.", "type": "text-input" }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                },
                required: ['description', 'type'],
              },
            },
          },
          required: ['career', 'introduction', 'tasks'],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("❌ Lỗi khi bắt đầu mô phỏng:", error);
    throw error;
  }
};

export const evaluateSimulation = async (
  career: string,
  answers: UserAnswer[]
): Promise<SimulationReport> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

  const answersString = answers.map((a, i) =>
    `Nhiệm vụ ${i + 1}: ${a.taskDescription}\nNgười dùng trả lời: ${a.answer}`
  ).join('\n\n');

  const prompt = `Bạn là một chuyên gia hướng nghiệp và quản lý nhân sự cấp cao.
Nhiệm vụ của bạn là đánh giá phần thể hiện của một ứng viên trong một kịch bản mô phỏng cho ngành nghề: "${career}".

**Dữ liệu mô phỏng:**
${answersString}

**YÊU CẦU ĐÁNH GIÁ (TRẢ VỀ DƯỚI DẠNG JSON):**
Dựa vào các câu trả lời, hãy cung cấp một bản phân tích chi tiết:

1.  **strengths (string):** Viết một đoạn văn nêu bật những điểm mạnh ứng viên đã thể hiện (ví dụ: tư duy logic, sự đồng cảm, kỹ năng giao tiếp).
2.  **improvements (string):** Viết một đoạn văn chỉ ra những điểm cần cải thiện một cách xây dựng.
3.  **competencySummary (object):** Chấm điểm các năng lực sau trên thang điểm 10. Điểm phải là SỐ NGUYÊN.
    *   \`criticalThinking\`: (number) Khả năng phân tích, giải quyết vấn đề.
    *   \`professionalSkills\`: (number) Sự phù hợp của câu trả lời với chuyên môn ngành.
    *   \`communication\`: (number) Kỹ năng diễn đạt, giao tiếp, thuyết phục.
    *   \`adaptability\`: (number) Khả năng ứng biến, linh hoạt.
4.  **developmentSuggestions (array of strings):** Đề xuất 2-3 hành động cụ thể để phát triển, ví dụ: "Tham gia khóa học về Excel nâng cao", "Đọc sách 'Đắc Nhân Tâm' để cải thiện giao tiếp".
5.  **refinedRecommendations (array of strings):** Dựa trên phong cách trả lời, gợi ý 2-3 ngành nghề liên quan khác mà ứng viên có thể phù hợp.

**QUAN TRỌNG:** Trả về một đối tượng JSON DUY NHẤT, không có markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.STRING },
            improvements: { type: Type.STRING },
            competencySummary: {
              type: Type.OBJECT,
              properties: {
                criticalThinking: { type: Type.INTEGER },
                professionalSkills: { type: Type.INTEGER },
                communication: { type: Type.INTEGER },
                adaptability: { type: Type.INTEGER },
              },
              required: ['criticalThinking', 'professionalSkills', 'communication', 'adaptability'],
            },
            developmentSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            refinedRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['strengths', 'improvements', 'competencySummary', 'developmentSuggestions', 'refinedRecommendations'],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("❌ Lỗi khi đánh giá mô phỏng:", error);
    throw error;
  }
};
