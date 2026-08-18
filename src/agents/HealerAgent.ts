import { GeminiClient } from '../ai/GeminiClient.js';
import { ExecutionResult, TestPlan, HealingAttempt, FailureDetails } from '../models/AgentState.js';
import { HealerPrompt } from '../prompts/prompts.js';
import { logger } from '../utils/logger.js';
import { writeFile } from '../utils/fileUtils.js';
import path from 'path';
import { constants } from '../config/env.js';

export class HealerAgent {
  private gemini: GeminiClient;
  private testDir: string;

  constructor(gemini: GeminiClient, testDir: string = path.join(constants.GENERATED_DIR, 'tests')) {
    this.gemini = gemini;
    this.testDir = testDir;
  }

  async diagnoseAndHeal(
    testPlan: TestPlan,
    executionResult: ExecutionResult,
    currentTestCode: string,
    attemptNumber: number,
  ): Promise<HealingAttempt> {
    logger.log(`[HEALER] ========================================`);
    logger.log(`[HEALER] Healing attempt ${attemptNumber}`);

    if (
      executionResult.error?.includes('No tests found') ||
      executionResult.stderr?.includes('No tests found') ||
      executionResult.stdout?.includes('No tests found')
    ) {
      logger.error('[HEALER] DETECTED: "No tests found" - This is a TEST GENERATION/DISCOVERY PROBLEM');
      logger.error('[HEALER] This is NOT a locator or assertion problem');
      logger.error('[HEALER] Reason: The Playwright test file was not discoverable by the test runner');
      logger.error('[HEALER] Action: regenerate a valid .spec.ts file and verify the config/testDir/testMatch');

      const generatedSpecName = this.findGeneratedSpecFile() || 'generated.spec.ts';
      const regeneratedCode = await this.generateFallbackTest(testPlan, generatedSpecName);

      const healingAttempt: HealingAttempt = {
        attemptNumber,
        diagnosis:
          'NO_TESTS_FOUND - The generated test was not discoverable by Playwright. This is a discovery/configuration issue, not a locator problem.',
        correction: regeneratedCode,
      };

      try {
        const testFilePath = path.join(this.testDir, generatedSpecName);
        await writeFile(testFilePath, regeneratedCode);
        logger.log('[HEALER] Regenerated discoverable spec: ' + testFilePath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('[HEALER] Failed to save regenerated code:', errorMsg);
      }

      return healingAttempt;
    }

    const failureInfo = this.formatFailureInfo(executionResult);
    logger.log('[HEALER] Failure diagnosis:', failureInfo);

    const prompt = HealerPrompt.createPrompt(testPlan, failureInfo, currentTestCode);
    const response = await this.gemini.generateStructuredResponse(prompt);

    if (!response.success || !response.parsed) {
      logger.error('[HEALER] Gemini diagnosis failed');
      return {
        attemptNumber,
        diagnosis: 'Failed to get diagnosis from Gemini',
        correction: 'No correction available',
      };
    }

    const healerResponse = response.parsed as Record<string, unknown>;
    const diagnosis = (healerResponse.diagnosis as string) || 'Unknown issue';
    const correction = (healerResponse.correction as string) || currentTestCode;
    const reasoning = (healerResponse.reasoning as string) || '';

    logger.log('[HEALER] Diagnosis:', diagnosis);
    logger.log('[HEALER] Correction plan:', reasoning);

    const healingAttempt: HealingAttempt = {
      attemptNumber,
      diagnosis,
      correction,
    };

    try {
      const target = this.findGeneratedSpecFile() || 'generated.spec.ts';
      const testFilePath = path.join(this.testDir, target);
      await writeFile(testFilePath, correction);
      logger.log('[HEALER] Applied correction to test file');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[HEALER] Failed to save corrected code:', errorMsg);
    }

    return healingAttempt;
  }

  private findGeneratedSpecFile(): string | undefined {
    const fs = require('fs');
    if (!fs.existsSync(this.testDir)) {
      return undefined;
    }

    const files = fs.readdirSync(this.testDir) as string[];
    return files.find((file: string) => file.endsWith('.spec.ts'));
  }

  private async generateFallbackTest(testPlan: TestPlan, targetFileName: string): Promise<string> {
    const loginUser = testPlan.user || 'standard_user';
    const loginPassword = testPlan.password || 'secret_sauce';
    const targetProduct = testPlan.products[0] || 'Sauce Labs Bike Light';

    const fallbackTest = `import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.js';
import { ProductsPage } from '../page-objects/ProductsPage.js';

test('generated user story test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);

  await loginPage.navigate();
  await loginPage.login('${loginUser}', '${loginPassword}');

  const productName = '${targetProduct}';
  await productsPage.addToCart(productName);
  await productsPage.openCart();
  await productsPage.verifyProductInCart(productName);

  await expect(page.locator('.cart_item')).toContainText(productName);
});`;

    await writeFile(path.join(this.testDir, targetFileName), fallbackTest);
    return fallbackTest;
  }

  private formatFailureInfo(executionResult: ExecutionResult): string {
    const failureDetails: FailureDetails | undefined = executionResult.failureDetails;

    return `
Test Execution Failed

Error Type:
${
  failureDetails?.locatorIssue
    ? 'LOCATOR ISSUE - Element not found or selector incorrect'
    : failureDetails?.timingIssue
      ? 'TIMING ISSUE - Element not available in time'
      : failureDetails?.assertionIssue
        ? 'ASSERTION ISSUE - Expected condition not met'
        : failureDetails?.navigationIssue
          ? 'NAVIGATION ISSUE - Failed to navigate'
          : 'UNKNOWN ISSUE'
}

Error Message:
${executionResult.error || 'No error message'}

Test Output:
${executionResult.stdout.substring(0, 1000)}

Stderr:
${executionResult.stderr.substring(0, 1000)}
`;
  }
}
