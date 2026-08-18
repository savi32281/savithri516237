import { AgentState } from '../models/AgentState.js';
import { PlannerAgent } from './PlannerAgent.js';
import { ExplorerAgent } from './ExplorerAgent.js';
import { GeneratorAgent } from './GeneratorAgent.js';
import { ExecutorAgent } from './ExecutorAgent.js';
import { HealerAgent } from './HealerAgent.js';
import { ReportAgent } from './ReportAgent.js';
import { GeminiClient } from '../ai/GeminiClient.js';
import { logger } from '../utils/logger.js';
import { generateRunId } from '../utils/fileUtils.js';
import { getConfig, constants } from '../config/env.js';

export class OrchestratorAgent {
  private planner: PlannerAgent;
  private explorer: ExplorerAgent;
  private generator: GeneratorAgent;
  private executor: ExecutorAgent;
  private healer: HealerAgent;
  private reporter: ReportAgent;
  private config: ReturnType<typeof getConfig>;

  constructor(gemini: GeminiClient) {
    this.config = getConfig();

    this.planner = new PlannerAgent(gemini);
    this.explorer = new ExplorerAgent(gemini, this.config.baseUrl);
    this.generator = new GeneratorAgent(gemini);
    this.executor = new ExecutorAgent();
    this.healer = new HealerAgent(gemini);
    this.reporter = new ReportAgent();
  }

  async executeWorkflow(userStory: string, headed: boolean = false): Promise<AgentState> {
    const runId = generateRunId();
    const state: AgentState = {
      runId,
      userStory,
      timestamp: new Date().toISOString(),
      healingAttempts: [],
      maxHealingAttempts: this.config.maxHealAttempts,
      errors: [],
    };

    logger.log('[ORCHESTRATOR] ====================================================');
    logger.log('[ORCHESTRATOR] Starting autonomous test automation workflow');
    logger.log('[ORCHESTRATOR] Run ID:', runId);
    logger.log('[ORCHESTRATOR] ====================================================');

    try {
      // Phase 1: Planning
      logger.log('[ORCHESTRATOR] Phase 1: Planning');
      state.testPlan = await this.planner.plan(userStory);

      // Phase 2: Exploration
      logger.log('[ORCHESTRATOR] Phase 2: Exploration');
      state.exploration = await this.explorer.explore(state.testPlan, headed);

      // Phase 3: Code Generation
      logger.log('[ORCHESTRATOR] Phase 3: Code Generation');
      state.generationResult = await this.generator.generate(state.testPlan, state.exploration);

      if (!state.generationResult.success) {
        throw new Error(`Generation failed: ${state.generationResult.error}`);
      }

      logger.log('[ORCHESTRATOR] Generated test file: ' + state.generationResult.testFile);
      logger.log('[ORCHESTRATOR] Page Objects: ' + JSON.stringify(state.generationResult.pageObjectFiles));

      // Phase 4: Initial Execution
      logger.log('[ORCHESTRATOR] Phase 4: Initial Execution');
      logger.log('[ORCHESTRATOR] Executing test: ' + state.generationResult.testFile);
      state.initialExecutionResult = await this.executor.execute(
        state.generationResult.testFile,
        headed,
      );
      state.currentExecutionResult = state.initialExecutionResult;

      const startTime = Date.now();

      // Phase 5: Healing Loop (if needed)
      if (!state.initialExecutionResult.passed && state.maxHealingAttempts > 0) {
        logger.log('[ORCHESTRATOR] Phase 5: Healing Loop');
        await this.performHealing(state);
      }

      // Phase 6: Report Generation
      logger.log('[ORCHESTRATOR] Phase 6: Report Generation');

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      state.finalResult = {
        status: state.currentExecutionResult?.passed ? 'PASSED' : 'FAILED',
        totalDuration,
        healingApplied: state.healingAttempts.length > 0,
        healingSucceeded:
          state.healingAttempts.length > 0 && state.currentExecutionResult?.passed,
      };

      await this.reporter.generateReport(state);

      logger.log('[ORCHESTRATOR] ====================================================');
      logger.log('[ORCHESTRATOR] Workflow completed successfully');
      logger.log('[ORCHESTRATOR] Final status:', state.finalResult.status);
      logger.log('[ORCHESTRATOR] ====================================================');

      return state;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[ORCHESTRATOR] Workflow failed:', errorMsg);
      state.errors.push(errorMsg);

      state.finalResult = {
        status: 'FAILED',
        totalDuration: 0,
        healingApplied: false,
      };

      try {
        await this.reporter.generateReport(state);
      } catch (reportError) {
        logger.error('[ORCHESTRATOR] Failed to generate error report');
      }

      throw error;
    }
  }

  private async performHealing(state: AgentState): Promise<void> {
    let executionResult = state.initialExecutionResult!;
    let currentTestCode = await this.readGeneratedTest();
    let healingAttempt = 0;

    while (healingAttempt < state.maxHealingAttempts) {
      if (executionResult.passed) {
        logger.log('[ORCHESTRATOR] Test passed, no more healing needed');
        break;
      }

      healingAttempt++;
      logger.log('[ORCHESTRATOR] Healing attempt', healingAttempt);

      if (!state.testPlan) {
        throw new Error('Test plan is missing');
      }

      const healing = await this.healer.diagnoseAndHeal(
        state.testPlan,
        executionResult,
        currentTestCode,
        healingAttempt,
      );

      state.healingAttempts.push(healing);

      // Re-execute after healing
      logger.log('[ORCHESTRATOR] Re-executing test after healing');
      executionResult = await this.executor.execute(state.generationResult!.testFile, false);

      currentTestCode = healing.correction;
      state.currentExecutionResult = executionResult;

      if (executionResult.passed) {
        logger.log('[ORCHESTRATOR] Test passed after healing!');
        break;
      }
    }

    if (!executionResult.passed && healingAttempt >= state.maxHealingAttempts) {
      logger.warn('[ORCHESTRATOR] Maximum healing attempts reached, test still failing');
    }
  }

  private async readGeneratedTest(): Promise<string> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const testPath = path.join(constants.GENERATED_DIR, 'tests', 'generated.spec.ts');
      return fs.readFileSync(testPath, 'utf-8');
    } catch {
      return '// Unable to read generated test';
    }
  }
}
