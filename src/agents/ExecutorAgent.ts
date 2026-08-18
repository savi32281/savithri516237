import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { ExecutionResult, FailureDetails } from '../models/AgentState.js';
import { logger } from '../utils/logger.js';
import { constants } from '../config/env.js';

const execAsync = promisify(exec);

export class ExecutorAgent {
  private testDir: string;

  constructor(testDir: string = path.join(constants.GENERATED_DIR, 'tests')) {
    this.testDir = testDir;
  }

  async execute(testFileName: string, headed: boolean = false): Promise<ExecutionResult> {
    const startTime = Date.now();
    logger.log('[EXECUTOR] ========================================');
    logger.log('[EXECUTOR] Starting test execution');

    const resolvedTestFileName = this.resolveTestFileName(testFileName);
    logger.log('[EXECUTOR] Test file: ' + resolvedTestFileName);

    try {
      const validationResult = this.validateTestFile(resolvedTestFileName);
      if (!validationResult.valid) {
        const duration = Date.now() - startTime;
        const errorMsg = validationResult.error || 'Unknown validation error';
        logger.error('[EXECUTOR] Test validation failed:', errorMsg);
        return {
          testFile: resolvedTestFileName,
          passed: false,
          duration,
          error: errorMsg,
          stdout: '',
          stderr: errorMsg,
          failureDetails: {
            testName: resolvedTestFileName,
            error: errorMsg,
            navigationIssue: true,
          },
        };
      }

      logger.log('[EXECUTOR] Test discovery validation: PASSED');
      const testPath = path.join(this.testDir, resolvedTestFileName);
      const relativePath = `generated/tests/${resolvedTestFileName}`;
      const command = `npx playwright test "${relativePath}"${headed ? ' --headed' : ''}`;

      logger.log('[EXECUTOR] Test file path: ' + testPath);
      logger.log('[EXECUTOR] Running Playwright...');
      logger.log('[EXECUTOR] Command: ' + command);

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10,
        });

        const duration = Date.now() - startTime;

        if (stdout.includes('No tests found') || stderr.includes('No tests found')) {
          logger.error('[EXECUTOR] CRITICAL: No tests found by Playwright');
          logger.error('[EXECUTOR] stdout:', stdout.substring(0, 500));
          logger.error('[EXECUTOR] stderr:', stderr.substring(0, 500));
          return {
            testFile: resolvedTestFileName,
            passed: false,
            duration,
            error: 'No tests found - likely a test discovery/naming/configuration issue',
            stdout,
            stderr,
            failureDetails: {
              testName: resolvedTestFileName,
              error: 'No tests found',
              navigationIssue: true,
            },
            executionCommand: command,
          };
        }

        const passed = !stdout.includes('failed') && !stdout.includes('No tests found') && stderr === '';

        logger.log('[EXECUTOR] Result: ' + (passed ? 'PASSED' : 'FAILED'));
        logger.log('[EXECUTOR] Duration: ' + duration + 'ms');

        return {
          testFile: resolvedTestFileName,
          passed,
          duration,
          stdout,
          stderr,
          executionCommand: command,
        };
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string; code?: number };
        const stdout = execError.stdout || '';
        const stderr = execError.stderr || '';
        const duration = Date.now() - startTime;

        logger.error('[EXECUTOR] Actual Playwright error:');
        logger.error(stdout || stderr || 'Unknown Playwright error');

        const failureDetails = this.parseFailure(stdout, stderr);

        return {
          testFile: resolvedTestFileName,
          passed: false,
          duration,
          error: stderr || stdout || 'Test execution failed',
          stdout,
          stderr,
          failureDetails,
          executionCommand: command,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;

      logger.error('[EXECUTOR] Test execution error:', errorMsg);

      return {
        testFile: resolvedTestFileName,
        passed: false,
        duration,
        error: errorMsg,
        stdout: '',
        stderr: errorMsg,
      };
    }
  }

  private resolveTestFileName(testFileName: string): string {
    if (testFileName && testFileName.endsWith('.spec.ts')) {
      const absolute = path.join(this.testDir, testFileName);
      if (existsSync(absolute)) {
        return testFileName;
      }
    }

    const discovered = this.findGeneratedSpecFile();
    if (discovered) {
      return discovered;
    }

    return testFileName || 'generated.spec.ts';
  }

  private findGeneratedSpecFile(): string | undefined {
    if (!existsSync(this.testDir)) {
      return undefined;
    }

    const files = require('fs').readdirSync(this.testDir) as string[];
    const spec = files.find((file: string) => file.endsWith('.spec.ts'));
    return spec;
  }

  private parseFailure(stdout: string, stderr: string): FailureDetails | undefined {
    const output = stdout + stderr;
    const testNameMatch = output.match(/Error: (\w+)/);
    const testName = testNameMatch ? testNameMatch[1] : 'Unknown';

    let locatorIssue = false;
    let timingIssue = false;
    let assertionIssue = false;
    let navigationIssue = false;

    if (output.includes('locator') || output.includes('selector') || output.includes('not found')) {
      locatorIssue = true;
    }

    if (output.includes('timeout') || output.includes('Timeout')) {
      timingIssue = true;
    }

    if (output.includes('AssertionError') || output.includes('expect')) {
      assertionIssue = true;
    }

    if (output.includes('navigate') || output.includes('Navigation') || output.includes('No tests found')) {
      navigationIssue = true;
    }

    const location = output.split('\n').find((line) => line.includes('at '));

    return {
      testName,
      error: output.substring(0, 500),
      location: location || undefined,
      locatorIssue,
      timingIssue,
      assertionIssue,
      navigationIssue,
    };
  }

  private validateTestFile(testFileName: string): { valid: boolean; error?: string } {
    logger.log('[EXECUTOR] Validating test file: ' + testFileName);

    if (!testFileName || !testFileName.endsWith('.spec.ts')) {
      return {
        valid: false,
        error: `Invalid filename: "${testFileName}" must end with .spec.ts`,
      };
    }
    logger.log('[EXECUTOR] Filename format: VALID');

    const testPath = path.join(this.testDir, testFileName);
    if (!existsSync(testPath)) {
      return {
        valid: false,
        error: `Test file not found: ${testPath}`,
      };
    }
    logger.log('[EXECUTOR] File existence: VALID');

    try {
      const content = readFileSync(testPath, 'utf-8');

      if (!content.includes('@playwright/test')) {
        return {
          valid: false,
          error: 'Test file must import from @playwright/test',
        };
      }
      logger.log('[EXECUTOR] Import statement: VALID');

      if (!content.includes('test(')) {
        return {
          valid: false,
          error: 'Test file must contain test() blocks',
        };
      }
      logger.log('[EXECUTOR] test() blocks: VALID');

      if (content.includes('TODO') || content.includes('Ensure') || content.includes('structure:')) {
        return {
          valid: false,
          error: 'Test file contains pseudo-code or instructions instead of executable code',
        };
      }
      logger.log('[EXECUTOR] Code quality: VALID');
      logger.log('[EXECUTOR] All validations: PASSED');
      return { valid: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: `Failed to read test file: ${errorMsg}`,
      };
    }
  }
}
