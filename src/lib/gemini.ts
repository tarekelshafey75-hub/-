import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { AnalysisResult, ChatMessage } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function analyzeReviews(rawText: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze the following customer reviews. 
    1. Extract individual reviews with a sentiment score (-1 to 1) and a sentiment label (positive, neutral, negative).
    2. If dates are not provided in the text, generate realistic dates over the last 30 days to show a trend.
    3. Identify the most frequent praises and complaints for a word cloud.
    4. Provide an executive summary with the top 3 actionable areas for improvement.
    
    Reviews:
    ${rawText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reviews: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                date: { type: Type.STRING, description: "ISO date string" },
                sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
                score: { type: Type.NUMBER }
              },
              required: ["id", "text", "date", "sentiment", "score"]
            }
          },
          summary: { type: Type.STRING },
          trends: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                score: { type: Type.NUMBER }
              },
              required: ["date", "score"]
            }
          },
          wordCloud: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                value: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ["praise", "complaint"] }
              },
              required: ["text", "value", "type"]
            }
          },
          topActionableItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["reviews", "summary", "trends", "wordCloud", "topActionableItems"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatWithAI(history: ChatMessage[], message: string, context: AnalysisResult | null) {
  const systemInstruction = `
    You are a Customer Experience Expert. 
    You help users understand their customer sentiment data.
    ${context ? `Current Analysis Context: ${JSON.stringify(context.summary)}` : ''}
    Be professional, data-driven, and actionable.
  `;

  const chat = ai.chats.create({
    model: "gemini-3.5-flash",
    config: {
      systemInstruction,
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
