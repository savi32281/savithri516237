import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse } from '../models/AgentState.js';

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = modelName;
  }

  async generateText(prompt: string): Promise<GeminiResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        content: undefined,
        error: errorMsg,
      };
    }
  }

  async generateStructuredResponse(prompt: string): Promise<GeminiResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            content: text,
            parsed,
          };
        } catch (parseError) {
          // If JSON parsing fails, return the raw text
          return {
            success: true,
            content: text,
            parsed: undefined,
          };
        }
      }

      return {
        success: true,
        content: text,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        content: undefined,
        error: errorMsg,
      };
    }
  }
}
