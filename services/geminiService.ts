
import { GoogleGenAI, Type } from "@google/genai";
import { AIPatternResponse, Instrument } from "../types";

export const generateAIPattern = async (prompt: string): Promise<AIPatternResponse | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a professional 4-bar (64 steps) drum pattern for the following style: "${prompt}".
      Return the pattern as a JSON object where keys are the instrument names ('Kick', 'Snare', 'HiHat', 'OpenHH', 'Clap', 'Cowbell') 
      and values are arrays of step indices (0 to 63) where a note should be played. 
      Ensure the pattern is musically coherent and fits the 16th note grid.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patterns: {
              type: Type.OBJECT,
              properties: {
                Kick: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                Snare: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                HiHat: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                OpenHH: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                Clap: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                Cowbell: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              },
            },
            genre: { type: Type.STRING },
          },
          required: ["patterns", "genre"],
        },
      },
    });

    const data = JSON.parse(response.text.trim());
    return data as AIPatternResponse;
  } catch (error) {
    console.error("Gemini AI failed:", error);
    return null;
  }
};
