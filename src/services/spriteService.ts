import { GoogleGenAI } from "@google/genai";

export class SpriteService {
  private static instance: SpriteService;
  private generatedUrl: string | null = null;
  private isGenerating: boolean = false;

  private constructor() {}

  public static getInstance(): SpriteService {
    if (!SpriteService.instance) {
      SpriteService.instance = new SpriteService();
    }
    return SpriteService.instance;
  }

  public async generateCheetahSpriteSheet(): Promise<string | null> {
    if (this.generatedUrl) return this.generatedUrl;
    if (this.isGenerating) return null;

    this.isGenerating = true;
    try {
      // Use the selected API key if available, fallback to default
      const apiKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          parts: [
            {
              text: 'A professional 2D game sprite sheet of a cheetah running. Side view. 8 distinct frames arranged in a 4x2 grid. Clean white background. Pixel art style. Vibrant colors.',
            },
          ],
        }],
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          this.generatedUrl = `data:image/png;base64,${base64EncodeString}`;
          return this.generatedUrl;
        }
      }
    } catch (error) {
      console.error("Error generating sprite sheet:", error);
    } finally {
      this.isGenerating = false;
    }
    return null;
  }

  public getGeneratedUrl(): string | null {
    return this.generatedUrl;
  }
}
