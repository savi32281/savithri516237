import { GeminiClient } from '../ai/GeminiClient.js';
import { TestPlan } from '../models/AgentState.js';
import { PlannerPrompt } from '../prompts/prompts.js';
import { logger } from '../utils/logger.js';

export class PlannerAgent {
  private gemini: GeminiClient;

  constructor(gemini: GeminiClient) {
    this.gemini = gemini;
  }

  async plan(userStory: string): Promise<TestPlan> {
    logger.log('[PLANNER] Creating test plan from user story');
    logger.debug('[PLANNER] User story:', userStory);

    const prompt = PlannerPrompt.createPrompt(userStory);
    const response = await this.gemini.generateStructuredResponse(prompt);

    if (!response.success) {
      throw new Error(`[PLANNER] Gemini request failed: ${response.error}`);
    }

    if (!response.parsed) {
      logger.error('[PLANNER] Failed to parse Gemini response', response.content);
      throw new Error('[PLANNER] Could not parse test plan from Gemini response');
    }

    const testPlan = (response.parsed as unknown) as TestPlan;

    logger.log('[PLANNER] Test plan created', {
      scenario: testPlan.scenarioName,
      products: testPlan.products,
      requiresLogin: testPlan.requiresLogin,
      requiresCheckout: testPlan.requiresCheckout,
    });

    return testPlan;
  }
}
