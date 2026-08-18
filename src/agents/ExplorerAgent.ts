import { chromium, Browser, Page } from 'playwright';
import { GeminiClient } from '../ai/GeminiClient.js';
import { ExplorationResult, TestPlan } from '../models/AgentState.js';
import { logger } from '../utils/logger.js';
import { constants } from '../config/env.js';

export class ExplorerAgent {
  private gemini: GeminiClient;
  private baseUrl: string;

  constructor(gemini: GeminiClient, baseUrl: string = constants.SAUCEDEMO_URL) {
    this.gemini = gemini;
    this.baseUrl = baseUrl;
  }

  async explore(testPlan: TestPlan, headed: boolean = false): Promise<ExplorationResult> {
    logger.log('[EXPLORER] Starting application exploration');
    logger.log('[EXPLORER] Navigation path:', testPlan.navigationPath);

    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: !headed });
      const context = await browser.newContext();
      const page = await context.newPage();

      const exploration = await this.explorePages(page, testPlan);

      await context.close();

      logger.log('[EXPLORER] Exploration complete', {
        pagesExplored: exploration.pages.length,
        locatorsFound: Object.keys(exploration.locators).length,
      });

      return exploration;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[EXPLORER] Exploration failed:', errorMsg);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async explorePages(page: Page, testPlan: TestPlan): Promise<ExplorationResult> {
    const exploration: ExplorationResult = {
      timestamp: new Date().toISOString(),
      pages: [],
      locators: {},
    };

    // Navigate through each page in the path
    for (const pathSegment of testPlan.navigationPath) {
      const url = this.baseUrl + pathSegment;
      logger.log(`[EXPLORER] Navigating to: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForLoadState('domcontentloaded');

        // Identify the page type
        const pageName = this.identifyPage(pathSegment);
        logger.log(`[EXPLORER] Exploring ${pageName} page`);

        // Extract page content and elements
        const pageTitle = await page.title();

        // Use Gemini to analyze the page
        const analysisPrompt = `
Analyze this SauceDemo page structure and identify useful locators:

Page: ${pageName}
URL: ${url}
Title: ${pageTitle}

Identify the most important UI elements and their best locators (prefer data-test attributes, ARIA roles).
Respond with JSON containing elements and locators.`;
        const analysisResponse = await this.gemini.generateStructuredResponse(analysisPrompt);

        if (analysisResponse.success && analysisResponse.parsed) {
          const pageAnalysis = analysisResponse.parsed as Record<string, unknown>;
          exploration.pages.push({
            pageName,
            url,
            elements: (Array.isArray(pageAnalysis.elements) ? pageAnalysis.elements : []) as never[],
            accessibility: pageAnalysis.accessibility as string | undefined,
            observations: Array.isArray(pageAnalysis.observations)
              ? (pageAnalysis.observations as string[])
              : [],
          });

          // Merge locators
          if (typeof pageAnalysis.locators === 'object' && pageAnalysis.locators !== null) {
            Object.assign(exploration.locators, pageAnalysis.locators);
          }
        }

        // If login is needed, perform it
        if (testPlan.requiresLogin && this.isLoginPage(pathSegment)) {
          await this.performLogin(page, testPlan.user || 'standard_user');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`[EXPLORER] Error exploring ${pathSegment}: ${errorMsg}`);
      }
    }

    return exploration;
  }

  private identifyPage(pathSegment: string): string {
    if (pathSegment === '/' || pathSegment === '') return 'Login';
    if (pathSegment.includes('inventory')) return 'Products';
    if (pathSegment.includes('cart')) return 'Cart';
    if (pathSegment.includes('checkout-step-one')) return 'Checkout Information';
    if (pathSegment.includes('checkout-step-two')) return 'Checkout Overview';
    if (pathSegment.includes('checkout-complete')) return 'Checkout Complete';
    return 'Unknown';
  }

  private isLoginPage(pathSegment: string): boolean {
    return pathSegment === '/' || pathSegment === '';
  }

  private async performLogin(page: Page, user: string): Promise<void> {
    logger.log(`[EXPLORER] Performing login as: ${user}`);

    const password = 'secret_sauce';

    try {
      // Try common locators for login fields
      const usernameSelectors = [
        '[data-test="username"]',
        '[name="user-name"]',
        'input[type="text"]',
        '#user-name',
      ];

      const passwordSelectors = [
        '[data-test="password"]',
        '[name="password"]',
        'input[type="password"]',
        '#password',
      ];

      const loginButtonSelectors = [
        '[data-test="login-button"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        '#login-button',
      ];

      // Fill username
      for (const selector of usernameSelectors) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            await page.fill(selector, user);
            break;
          }
        } catch {}
      }

      // Fill password
      for (const selector of passwordSelectors) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            await page.fill(selector, password);
            break;
          }
        } catch {}
      }

      // Click login button
      for (const selector of loginButtonSelectors) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            await page.click(selector);
            break;
          }
        } catch {}
      }

      await page.waitForNavigation({ waitUntil: 'networkidle' });
      logger.log('[EXPLORER] Login completed');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn(`[EXPLORER] Login failed: ${errorMsg}`);
    }
  }
}
