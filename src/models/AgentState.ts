export interface TestPlan {
  scenarioName: string;
  userStory: string;
  user?: string;
  password?: string;
  products: string[];
  actions: string[];
  expectedResults: string[];
  assertions: string[];
  navigationPath: string[];
  requiresCheckout: boolean;
  requiresLogin: boolean;
  testData?: Record<string, string>;
}

export interface ExplorationResult {
  timestamp: string;
  pages: PageExploration[];
  credentials?: {
    username: string;
    // Password not stored in artifacts
  };
  locators: Record<string, string>;
  error?: string;
}

export interface PageExploration {
  pageName: string;
  url?: string;
  elements: ElementInfo[];
  accessibility?: string;
  observations?: string[];
}

export interface ElementInfo {
  name: string;
  type: string;
  locator: string;
  label?: string;
  accessible?: boolean;
  ariaRole?: string;
}

export interface GenerationResult {
  success: boolean;
  pageObjectFiles: string[];
  testFile: string;
  error?: string;
}

export interface ExecutionResult {
  testFile: string;
  passed: boolean;
  duration: number;
  error?: string;
  stdout: string;
  stderr: string;
  executionCommand?: string;
  failureDetails?: FailureDetails;
}

export interface FailureDetails {
  testName: string;
  error: string;
  location?: string;
  locatorIssue?: boolean;
  timingIssue?: boolean;
  assertionIssue?: boolean;
  navigationIssue?: boolean;
}

export interface HealingAttempt {
  attemptNumber: number;
  diagnosis: string;
  correction: string;
  executionResult?: ExecutionResult;
}

export interface AgentState {
  runId: string;
  userStory: string;
  timestamp: string;

  // Planning
  testPlan?: TestPlan;

  // Exploration
  exploration?: ExplorationResult;

  // Generation
  generationResult?: GenerationResult;
  discoveredLocators?: Record<string, string>;

  // Execution
  initialExecutionResult?: ExecutionResult;
  currentExecutionResult?: ExecutionResult;

  // Healing
  healingAttempts: HealingAttempt[];
  maxHealingAttempts: number;

  // Final
  finalResult?: {
    status: 'PASSED' | 'FAILED';
    totalDuration: number;
    healingApplied: boolean;
    healingSucceeded?: boolean;
  };

  // Metadata
  errors: string[];
}

export interface GeminiResponse {
  success: boolean;
  content?: string;
  parsed?: Record<string, unknown>;
  error?: string;
}
