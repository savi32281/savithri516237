#!/usr/bin/env node

import readline from 'readline';
import { GeminiClient } from './ai/GeminiClient.js';
import { OrchestratorAgent } from './agents/OrchestratorAgent.js';
import { getConfig } from './config/env.js';
import { logger } from './utils/logger.js';

function displayBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           AUTONOMOUS AI PLAYWRIGHT TEST AUTOMATION AGENT                     ║
║                                                                              ║
║                        Powered by Gemini & MCP                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
}

function displayInstructions(): void {
  console.log(`
📖 HOW TO USE:
   1. Enter your test requirement (User Story) describing what you want to test
   2. The agent will autonomously:
      - Analyze your requirement
      - Explore the live SauceDemo application
      - Generate Playwright test automation code
      - Execute the test
      - Self-heal any failures
      - Generate a comprehensive report

📋 EXAMPLE USER STORIES:
   - "Login with standard_user and verify the products page loads with at least one product"
   - "Add Sauce Labs Backpack to cart and verify the cart badge shows 1"
   - "Complete the checkout flow with a product"
   - "Login with locked_out_user and verify login fails with correct error message"

🎯 SUPPORTED SAUCEDEMO USERS:
   - standard_user
   - locked_out_user
   - problem_user
   - performance_glitch_user
   - error_user
   - visual_user

Password: secret_sauce (handled automatically)

📝 SUPPORTED PRODUCTS:
   - Sauce Labs Backpack
   - Sauce Labs Bike Light
   - Sauce Labs Bolt T-Shirt
   - Sauce Labs Fleece Jacket
   - Sauce Labs Onesie
   - Test.allTheThings() T-Shirt (Red)

⏱️ Processing typically takes 30-60 seconds

  `);
}

async function getUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function displaySummary(state: unknown): void {
  const typedState = state as {
    runId?: string;
    userStory?: string;
    testPlan?: { scenarioName?: string };
    initialExecutionResult?: { passed?: boolean };
    healingAttempts?: unknown[];
    finalResult?: {
      status?: string;
      totalDuration?: number;
    };
  };

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║          AUTONOMOUS TEST AUTOMATION COMPLETED                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Scenario:
  ${typedState.testPlan?.scenarioName || 'Unknown'}

User Story:
  ${typedState.userStory || 'Not available'}

Initial Execution:
  ${typedState.initialExecutionResult?.passed ? '✅ PASSED' : '❌ FAILED'}

Healing Attempts:
  ${typedState.healingAttempts?.length || 0}

Final Execution:
  ${typedState.finalResult?.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

Execution Duration:
  ${((typedState.finalResult?.totalDuration || 0) / 1000).toFixed(2)} seconds

Report Location:
  artifacts/reports/final-report.html

Run ID:
  ${typedState.runId}

════════════════════════════════════════════════════════════════════════════════
  `);
}

async function main(): Promise<void> {
  displayBanner();
  displayInstructions();

  try {
    // Get configuration
    const config = getConfig();

    logger.log('[MAIN] Initializing Autonomous AI Test Agent');
    logger.log('[MAIN] API Model:', config.geminiModel);

    // Initialize Gemini client
    const gemini = new GeminiClient(config.geminiApiKey, config.geminiModel);

    // Initialize orchestrator
    const orchestrator = new OrchestratorAgent(gemini);

    // Check for --headed flag
    const headed = process.argv.includes('--headed');
    logger.log('[MAIN] Headed mode:', headed);

    // Get user input
    const userStory = await getUserInput('📝 Enter User Story: ');

    if (!userStory.trim()) {
      console.error('❌ User story cannot be empty');
      process.exit(1);
    }

    console.log(`
🚀 Starting autonomous test automation workflow...
⏳ This may take 30-60 seconds...
    `);

    // Execute workflow
    const result = await orchestrator.executeWorkflow(userStory, headed);

    // Display summary
    displaySummary(result);

    // Exit successfully
    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Fatal Error: ${errorMsg}\n`);
    logger.error('[MAIN] Fatal error:', errorMsg);
    process.exit(1);
  }
}

// Run main
main();
