
import { GoogleGenAI, Type } from "@google/genai";
import { Brand, Campaign, BrandTone } from "../types";

export class GeminiService {
  async generateCampaignCopy(brand: Brand, campaign: Campaign) {
    if (!process.env.API_KEY) {
      return this.fallbackCopy(brand, campaign);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Generate marketing copy for a campaign.
        Brand: ${brand.name} (${brand.description})
        Tone: ${brand.tone}
        Offer: ${campaign.offer}
        Objective: ${campaign.objective}
        
        Requirements:
        1. 15 short headlines (max 30 chars)
        2. 5 long headlines (max 90 chars)
        3. 5 short descriptions (max 60 chars)
        4. 5 long descriptions (max 90 chars)
        5. 3 Call to Action variants (max 20 chars)
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shortHeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
              longHeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
              shortDescriptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              longDescriptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              ctas: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["shortHeadlines", "longHeadlines", "shortDescriptions", "longDescriptions", "ctas"]
          }
        }
      });

      const result = response.text || '';
      return JSON.parse(result);
    } catch (error) {
      console.error("Gemini failed, using fallback", error);
      return this.fallbackCopy(brand, campaign);
    }
  }

  async generateImage(prompt: string, aspectRatio: string = "1:1") {
    if (!process.env.API_KEY) return null;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: { aspectRatio }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error: any) {
      console.error("Image generation failed, falling back to simulated generation", error);
      
      const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\s]/g, '');
      let width = 800;
      let height = 800;
      if (aspectRatio === "16:9") height = 450;
      if (aspectRatio === "9:16") { width = 450; height = 800; }
      
      const seed = Math.floor(Math.random() * 1000000);
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    }
  }

  async suggestDesign(canvasJson: string, brand: Brand) {
    if (!process.env.API_KEY) return null;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze this design (JSON format) and suggest 3 improvements based on the brand: ${brand.name} (${brand.tone} tone).
        Design JSON: ${canvasJson}
        
        Return suggestions as a JSON array of strings.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Design suggestion failed", error);
      return [];
    }
  }

  private fallbackCopy(brand: Brand, campaign: Campaign) {
    const truncate = (str: string, max: number) => 
      str.length > max ? str.substring(0, max - 3) + '...' : str;

    const baseHeadline = `${campaign.offer} at ${brand.name}`;
    const baseDesc = `Get the best deals on ${brand.industry} for our ${campaign.market} customers. ${campaign.objective === 'Sales' ? 'Shop now!' : 'Learn more.'}`;

    return {
      shortHeadlines: Array(15).fill(0).map((_, i) => truncate(`${campaign.offer} - ${brand.name} #${i + 1}`, 30)),
      longHeadlines: Array(5).fill(0).map((_, i) => truncate(`${baseHeadline}: Exclusive ${brand.tone} Collection Available Now!`, 90)),
      shortDescriptions: Array(5).fill(0).map((_, i) => truncate(`Premium ${brand.industry} products. ${campaign.offer} for a limited time.`, 60)),
      longDescriptions: Array(5).fill(0).map((_, i) => truncate(`${baseDesc} Experience the luxury of ${brand.name} with our ${brand.tone} selection.`, 90)),
      ctas: ["Shop Now", "Buy Now", "Claim Offer"]
    };
  }
}

export const geminiService = new GeminiService();
