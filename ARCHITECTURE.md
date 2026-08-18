# Architecture & System Design

## System Overview

The Autonomous AI Test Automation Agent is a multi-agent system that orchestrates the creation, execution, and optimization of Playwright tests through intelligent AI reasoning.

## Agent Architecture

### 1. Orchestrator Agent
**Responsibility**: Main workflow controller
- Initializes the workflow
- Coordinates all other agents in sequence
- Manages state and error handling
- Implements healing loop with configurable max attempts
- Ensures proper cleanup and reporting

**Workflow**:
```
Start
  ↓
Initialize State
  ↓
Invoke Planner
  ↓
Invoke Explorer
  ↓
Invoke Generator
  ↓
Invoke Executor
  ├→ If PASS → Report
  ├→ If FAIL → Healer
  │         ↓
  │     Re-execute
  │         ↓
  │   Max attempts? → Report
```

### 2. Planner Agent
**Responsibility**: Convert user story to structured test plan
- Analyzes natural language requirements
- Uses Gemini to interpret test objectives
- Produces structured JSON test plan
- **Critical**: Preserves exact product names from user story
- Identifies required users and navigation paths

**Input**: User story string
**Output**: TestPlan object
```typescript
{
  scenarioName: string;
  userStory: string;
  user?: string;
  products: string[];        // EXACT names preserved
  actions: string[];
  expectedResults: string[];
  assertions: string[];
  navigationPath: string[];
  requiresCheckout: boolean;
  requiresLogin: boolean;
}
```

### 3. Explorer Agent
**Responsibility**: Live application exploration
- Launches Playwright browser in headed/headless mode
- Navigates through application pages
- Discovers UI elements and locators
- Uses accessibility APIs for element identification
- Performs login when needed
- Uses Gemini to analyze page structure

**Discovery Strategy** (in priority order):
1. `data-test` attributes (most stable)
2. ARIA roles and labels
3. Accessible names
4. CSS class selectors
5. XPath (fallback, less stable)

**Output**: ExplorationResult
```typescript
{
  timestamp: string;
  pages: [
    {
      pageName: string;
      elements: ElementInfo[];
      accessibility?: string;
      observations?: string[];
    }
  ];
  locators: Record<string, string>;
}
```

### 4. Generator Agent
**Responsibility**: Generate production-quality test automation code
- Creates Page Object Model (POM) classes
- Generates Playwright test file
- Uses discovered locators from Explorer
- Imports Page Objects in test
- **Critical**: Includes exact product names in generated code
- Validates code generation

**Generated Structure**:
```
generated/
├── page-objects/
│   ├── LoginPage.ts
│   ├── ProductsPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── tests/
│   └── generated.spec.ts
└── test-data/
    └── testData.ts
```

**Validation**: Before returning, verifies:
- All product names are present
- Assertions match test plan
- Page Objects are importable
- Test syntax is valid TypeScript

### 5. Executor Agent
**Responsibility**: Run generated Playwright test
- Invokes `npx playwright test`
- Captures stdout, stderr, exit code
- Analyzes output for pass/fail
- Extracts failure details
- Records execution metrics

**Failure Detection**:
- Parses error messages
- Identifies failure type (locator, timing, assertion, navigation)
- Extracts location and stack trace

**Output**: ExecutionResult
```typescript
{
  testFile: string;
  passed: boolean;
  duration: number;
  error?: string;
  stdout: string;
  stderr: string;
  failureDetails?: FailureDetails;
}
```

### 6. Healer Agent
**Responsibility**: Diagnose and fix test failures
- Analyzes execution failure
- Uses Gemini to reason about root cause
- Categorizes failure type:
  - Locator issue
  - Timing/synchronization issue
  - Assertion issue
  - Navigation issue
  - Generated code error
  - Product selection error
- Produces targeted correction
- Returns to Orchestrator for re-execution

**Diagnosis Process**:
1. Parse failure output
2. Send failure + code + test plan to Gemini
3. Get structured diagnosis (JSON)
4. Extract correction from response
5. Apply correction to test file
6. Return to Orchestrator for re-execution

### 7. Report Agent
**Responsibility**: Generate comprehensive execution report
- Creates HTML report with professional styling
- Generates JSON report for programmatic access
- Includes:
  - Test scenario and user story
  - Execution timeline
  - Pass/fail status
  - Healing summary
  - Generated file list
  - Failure analysis (if failed)
  - Metrics and timestamps
- **Security**: Masks all credentials and API keys

## Data Flow

```
┌─────────────────────┐
│   User Story        │
│   (Natural Lang)    │
└──────────┬──────────┘
           ↓
    ┌──────────────┐
    │   PLANNER    │
    │ (Gemini)     │
    └──────┬───────┘
           ↓
    ┌──────────────────────┐
    │ TestPlan (JSON)      │
    │ - scenario           │
    │ - products           │
    │ - navigation         │
    │ - actions            │
    │ - assertions         │
    └──────┬───────────────┘
           ↓
    ┌──────────────┐
    │  EXPLORER    │
    │ (Playwright) │
    └──────┬───────┘
           ↓
    ┌──────────────────────┐
    │ Exploration Result   │
    │ - discovered pages   │
    │ - locators found     │
    │ - accessibility info │
    └──────┬───────────────┘
           ↓
    ┌──────────────┐
    │  GENERATOR   │
    │  (Gemini)    │
    └──────┬───────┘
           ↓
    ┌──────────────────────┐
    │ Generated Code       │
    │ - Page Objects       │
    │ - Test File          │
    │ - Preserves Products │
    └──────┬───────────────┘
           ↓
    ┌──────────────┐
    │  EXECUTOR    │
    │ (Playwright) │
    └──────┬───────┘
           ↓
    ┌──────────────────────┐
    │ Execution Result     │
    │ - pass/fail          │
    │ - error details      │
    │ - duration           │
    └──────┬───────────────┘
           ↓
    IF FAIL:
    ┌──────────────┐
    │   HEALER     │
    │  (Gemini)    │
    └──────┬───────┘
           ↓
    ┌──────────────────────┐
    │ Correction Code      │
    │ (updated test)       │
    └──────┬───────────────┘
           ↓
    RE-EXECUTE & REPEAT
    (max attempts)
           ↓
    ┌──────────────┐
    │  REPORTER    │
    │   (File I/O) │
    └──────┬───────┘
           ↓
    ┌──────────────────────┐
    │ Final Report         │
    │ - HTML report        │
    │ - JSON report        │
    │ - Artifacts saved    │
    └──────────────────────┘
```

## State Management

Central `AgentState` object flows through workflow:

```typescript
interface AgentState {
  runId: string;                          // Unique run identifier
  userStory: string;                      // Original user story
  timestamp: string;                      // Start time
  
  testPlan?: TestPlan;                    // From Planner
  exploration?: ExplorationResult;        // From Explorer
  generationResult?: GenerationResult;    // From Generator
  
  initialExecutionResult?: ExecutionResult;    // First run
  currentExecutionResult?: ExecutionResult;    // After healing
  
  healingAttempts: HealingAttempt[];     // History of healing
  maxHealingAttempts: number;             // Config limit
  
  finalResult?: {
    status: 'PASSED' | 'FAILED';
    totalDuration: number;
    healingApplied: boolean;
    healingSucceeded?: boolean;
  };
  
  errors: string[];                       // Error log
}
```

## AI Integration (Gemini)

**Role**: Reasoning engine for all intelligent tasks

**Used in**:
1. **Planner**: Parse user story → Test plan
2. **Explorer**: Analyze page structure → Locators
3. **Generator**: Generate code from test plan
4. **Healer**: Diagnose failure → Correction

**Prompts**: Separate focused prompts in `src/prompts/prompts.ts`
- Each agent has a system prompt + specific task prompt
- Structured JSON responses for parsing
- Validation of Gemini responses before use

## Error Handling

**Strategy**: Graceful degradation with detailed logging

**Error Points**:
1. Missing Gemini API key → Fail fast with clear message
2. Explorer connection failure → Log and continue with defaults
3. Gemini API errors → Retry logic (once per agent)
4. Generation validation failure → Detailed error in report
5. Execution failure → Trigger healing (if attempts remain)
6. Max healing attempts reached → Stop and report FAILED

## Security Measures

1. **Secret Masking** (src/utils/masking.ts):
   - Masks API keys in logs
   - Hides passwords
   - Removes authorization tokens
   - Prevents credential exposure in reports

2. **Environment Variables**:
   - All secrets in .env file
   - .env in .gitignore
   - .env.example shows safe structure

3. **Report Generation**:
   - No credentials in HTML/JSON
   - No API keys in artifacts
   - Failure details sanitized

## Performance Characteristics

**Typical Workflow Duration**:
- Planner: 3-5 seconds
- Explorer: 15-20 seconds (browser launch + page loading)
- Generator: 5-8 seconds
- Executor: 10-15 seconds
- Healer (if needed): 5-8 seconds per attempt
- Reporter: 1-2 seconds

**Total**: 40-60 seconds per user story

**Parallelization**: Limited (mostly sequential due to state dependencies)

## Testing Approach

**Page Object Model** provides:
- Separation of concerns
- Maintainability
- Reusability
- Clear element locators
- Consistent API per page

**Generated Test Structure**:
```typescript
import { LoginPage } from '../page-objects/LoginPage';
import { ProductsPage } from '../page-objects/ProductsPage';

test('scenario name', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('standard_user', 'secret_sauce');
  
  const productsPage = new ProductsPage(page);
  await productsPage.verifyProductsVisible();
  // ... more actions
});
```

## Product Preservation Rule

**Critical Requirement**: Exact product names flow unchanged through entire pipeline

```
User Story: "Add Sauce Labs Backpack to cart"
    ↓ (Planner preserves)
TestPlan.products: ["Sauce Labs Backpack"]
    ↓ (Generator validates)
Generated Code: contains "Sauce Labs Backpack"
    ↓ (Executor runs)
Test clicks product: "Sauce Labs Backpack"
    ↓ (Report includes)
Final Report: Product name preserved
```

**Validation** at multiple points:
1. Planner output includes exact names
2. Generator verifies names in code
3. Executor searches for names in generated files
4. Report documents used products

---

**Next**: See [DESIGN-WRITEUP.md](DESIGN-WRITEUP.md) for why this agentic approach is valuable.
