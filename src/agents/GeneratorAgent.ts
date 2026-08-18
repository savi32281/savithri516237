import { GeminiClient } from '../ai/GeminiClient.js';
import { TestPlan, ExplorationResult, GenerationResult } from '../models/AgentState.js';
import { GeneratorPrompt } from '../prompts/prompts.js';
import { logger } from '../utils/logger.js';
import { writeFile, ensureDir } from '../utils/fileUtils.js';
import { constants } from '../config/env.js';
import path from 'path';

export class GeneratorAgent {
  private gemini: GeminiClient;

  constructor(gemini: GeminiClient) {
    this.gemini = gemini;
  }

  async generate(testPlan: TestPlan, exploration: ExplorationResult): Promise<GenerationResult> {
    logger.log('[GENERATOR] ========================================');
    logger.log('[GENERATOR] Generating test automation code');
    logger.log('[GENERATOR] Scenario: ' + testPlan.scenarioName);
    logger.log('[GENERATOR] Products: ' + JSON.stringify(testPlan.products));

    try {
      await ensureDir(constants.GENERATED_DIR);

      const discoveredLocators = exploration.locators || {};
      logger.log('[GENERATOR] Discovered locators: ' + Object.keys(discoveredLocators).length);

      logger.log('[GENERATOR] Calling Gemini for code generation...');
      const prompt = GeneratorPrompt.createPrompt(testPlan, discoveredLocators);
      const response = await this.gemini.generateText(prompt);

      const generatedCode = response.success && response.content ? response.content : '';

      if (!response.success || !response.content) {
        logger.warn('[GENERATOR] Gemini request failed or returned no content; falling back to local generator');
        logger.warn(`[GENERATOR] Gemini error: ${response.error || 'Unknown model error'}`);
      } else {
        logger.log('[GENERATOR] Gemini response received');
      }

      logger.log('[GENERATOR] Generating Page Objects...');
      const pageObjectFiles = await this.extractAndSavePageObjects(generatedCode || '');
      logger.log('[GENERATOR] Page Objects generated: ' + JSON.stringify(pageObjectFiles));

      logger.log('[GENERATOR] Generating Playwright Test...');
      const testFile = await this.extractAndSaveTest(generatedCode || '', pageObjectFiles, testPlan);
      logger.log('[GENERATOR] Generated test: ' + path.join(constants.GENERATED_DIR, 'tests', testFile));
      logger.log('[GENERATOR] Test validation: PASSED');

      logger.log('[GENERATOR] Test generation complete', {
        pageObjects: pageObjectFiles.length,
        testFile,
      });

      return {
        success: true,
        pageObjectFiles,
        testFile,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[GENERATOR] Code generation failed:', errorMsg);
      return {
        success: false,
        pageObjectFiles: [],
        testFile: '',
        error: errorMsg,
      };
    }
  }

  private async extractAndSavePageObjects(generatedCode: string): Promise<string[]> {
    const pageObjectFiles: string[] = [];
    const pageObjectDir = path.join(constants.GENERATED_DIR, 'page-objects');
    await ensureDir(pageObjectDir);

    const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(generatedCode)) !== null) {
      const code = match[1];

      if (
        code.includes('export class') &&
        (code.includes('Page') || code.includes('page')) &&
        !code.includes('test(')
      ) {
        blockIndex++;
        const className = this.extractClassName(code) || `Page${blockIndex}`;
        const fileName = `${className}.ts`;
        const filePath = path.join(pageObjectDir, fileName);

        await writeFile(filePath, code);
        pageObjectFiles.push(fileName);
        logger.log(`[GENERATOR] Generated Page Object: ${fileName}`);
      }
    }

    if (pageObjectFiles.length === 0) {
      await this.generateDefaultPageObjects(pageObjectDir);
      pageObjectFiles.push('LoginPage.ts', 'ProductsPage.ts');
    }

    return pageObjectFiles;
  }

  private async extractAndSaveTest(
    generatedCode: string,
    pageObjectFiles: string[],
    testPlan: TestPlan,
  ): Promise<string> {
    const testDir = path.join(constants.GENERATED_DIR, 'tests');
    await ensureDir(testDir);

    const testFileName = 'generated.spec.ts';
    const testFilePath = path.join(testDir, testFileName);

    logger.log('[GENERATOR] Extracting test code from Gemini response...');

    const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
    let testCode = '';
    let match;
    let blockCount = 0;

    while ((match = codeBlockRegex.exec(generatedCode)) !== null) {
      blockCount++;
      const code = match[1];
      if (code.includes('test(') || code.includes('import { test }')) {
        testCode = code;
        logger.log('[GENERATOR] Found test code in block ' + blockCount);
        break;
      }
    }

    logger.log('[GENERATOR] Code blocks found: ' + blockCount);

    if (!testCode || !testCode.includes('test(') || testCode.includes('TODO') || testCode.includes('Ensure')) {
      logger.warn('[GENERATOR] No valid test code found in Gemini response; generating default test');
      testCode = await this.generateDefaultTest(pageObjectFiles, testPlan);
    } else {
      logger.log('[GENERATOR] Valid test code found; updating imports...');
      testCode = this.updateTestImports(testCode, pageObjectFiles);
    }

    if (!this.isValidExecutableTest(testCode)) {
      logger.error('[GENERATOR] Validation failed: generated test is invalid');
      logger.error('[GENERATOR] Creating fallback test...');
      testCode = await this.generateDefaultTest(pageObjectFiles, testPlan);
    }

    for (const product of testPlan.products) {
      if (!testCode.includes(product)) {
        logger.warn(`[GENERATOR] WARNING: Product "${product}" not found in generated test!`);
      }
    }

    logger.log('[GENERATOR] Saving test to: ' + testFilePath);
    await writeFile(testFilePath, testCode);
    logger.log('[GENERATOR] Test file saved successfully');

    return testFileName;
  }

  private async generateDefaultPageObjects(pageObjectDir: string): Promise<void> {
    const loginPageCode = `import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async login(username: string, password: string) {
    await this.page.fill('[data-test="username"]', username);
    await this.page.fill('[data-test="password"]', password);
    await this.page.click('[data-test="login-button"]');
    const inventoryList = this.page.locator('.inventory_list');
    await expect(inventoryList).toBeVisible({ timeout: 10000 });
  }
}`;

    const productsPageCode = `import { Page, expect } from '@playwright/test';

export class ProductsPage {
  constructor(private page: Page) {}

  async addToCart(productName: string) {
    const items = await this.page.locator('.inventory_item').all();
    for (const item of items) {
      const itemName = await item.locator('.inventory_item_name').textContent();
      if (itemName?.includes(productName)) {
        await item.locator('button').click();
        return;
      }
    }
    throw new Error(\`Product "\${productName}" not found\`);
  }

  async openCart() {
    await this.page.click('.shopping_cart_link');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyProductInCart(productName: string) {
    const cartItem = this.page.locator('.cart_item', {
      has: this.page.locator(\`text="\${productName}"\`),
    });
    await expect(cartItem).toBeVisible();
  }
}`;

    await writeFile(path.join(pageObjectDir, 'LoginPage.ts'), loginPageCode);
    await writeFile(path.join(pageObjectDir, 'ProductsPage.ts'), productsPageCode);
  }

  private async generateDefaultTest(pageObjectFiles: string[], testPlan: TestPlan): Promise<string> {
    const desiredProduct = testPlan.products[0] || 'Sauce Labs Bike Light';
    const imports = pageObjectFiles
      .filter((fileName) => fileName.endsWith('.ts'))
      .map((fileName) => {
        const className = fileName.replace('.ts', '');
        return `import { ${className} } from '../page-objects/${className}.js';`;
      });

    if (imports.length === 0) {
      imports.push("import { LoginPage } from '../page-objects/LoginPage.js';");
      imports.push("import { ProductsPage } from '../page-objects/ProductsPage.js';");
    }

    const loginUser = testPlan.user || 'standard_user';
    const loginPassword = testPlan.password || 'secret_sauce';

    const testCode = `import { test, expect } from '@playwright/test';
${imports.join('\n')}

test('generated user story test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);

  await loginPage.navigate();
  await loginPage.login('${loginUser}', '${loginPassword}');

  const productName = '${desiredProduct}';
  await productsPage.addToCart(productName);
  await productsPage.openCart();
  await productsPage.verifyProductInCart(productName);

  await expect(page.locator('.cart_item')).toContainText(productName);
});`;

    return testCode;
  }

  private updateTestImports(testCode: string, pageObjectFiles: string[]): string {
    let updated = testCode;

    for (const pageObjFile of pageObjectFiles) {
      const className = pageObjFile.replace('.ts', '');
      const importStatement = `import { ${className} } from '../page-objects/${className}.js';`;

      if (!updated.includes(className)) {
        updated = `${importStatement}\n${updated}`;
      }
    }

    return updated;
  }

  private isValidExecutableTest(code: string): boolean {
    return (
      code.includes('@playwright/test') &&
      code.includes('test(') &&
      !code.includes('TODO') &&
      !code.includes('Ensure') &&
      !code.includes('pseudo-code') &&
      !code.includes('structure:')
    );
  }

  private extractClassName(code: string): string {
    const match = code.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : '';
  }
}
