import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateLuxuryWish = async (name: string): Promise<string> => {
  if (!apiKey) {
    return "The Arix Signature service is currently offline (API Key missing). Wishing you a golden holiday.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a royal advisor for the House of Arix. Write a very short, sophisticated, and luxurious 2-sentence Christmas/Holiday wish for "${name}". 
      
      Tone: Elegant, expensive, poetic, warm but grand.
      Keywords to incorporate subtley: Gold, Emerald, Light, Prosperity, Timeless.
      Do not use hashtags.`,
      config: {
        maxOutputTokens: 100,
        temperature: 0.8,
      }
    });

    return response.text || "May your holidays be wrapped in gold and light.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "May the splendor of the season illuminate your path.";
  }
};