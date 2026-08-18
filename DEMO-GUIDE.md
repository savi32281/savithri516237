# Demo Guide - 10 Minute Evaluator Walkthrough

## Pre-Demo Setup (5 minutes before)

### Prerequisites Checklist
- [ ] Node.js installed
- [ ] Gemini API key configured in .env
- [ ] Dependencies installed: `npm install && npx playwright install chromium`
- [ ] Application ready: `npm run typecheck` passes
- [ ] Terminal window ready

### Quick Health Check
```bash
# Verify setup
npm run typecheck

# Should complete with no errors
```

## Demo Timeline

### 0:00-0:30 | Introduction (30 seconds)

**What to say**:
> "This is an Autonomous AI Playwright Test Automation Agent. It demonstrates true agentic behavior—not just generating code, but actually exploring a live application, generating tests, executing them, and self-healing failures."

**Visual**:
- Show the project structure briefly
- Point out `src/agents/` folder with 7 agent modules

### 0:30-1:00 | Architecture Overview (30 seconds)

**What to show**:
```
Open ARCHITECTURE.md in editor
Show the agent diagram:

User Story
  ↓
Orchestrator
  ├→ Planner
  ├→ Explorer
  ├→ Generator
  ├→ Executor
  ├→ Healer (if needed)
  └→ Reporter
```

**What to say**:
> "Seven specialized agents work together. Each has one responsibility. The Orchestrator coordinates them."

### 1:00-1:30 | Start the Application (30 seconds)

**Command to run**:
```bash
npm start --headed
```

**What you'll see**:
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           AUTONOMOUS AI PLAYWRIGHT TEST AUTOMATION AGENT                     ║
║                                                                              ║
║                        Powered by Gemini & MCP                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📖 HOW TO USE: [instructions displayed]

📝 Enter User Story: [waiting for input]
```

**What to say**:
> "The application is now running and waiting for a user story. Notice it's not a GUI—it's a CLI, which shows this is real automation, not a toy demo."

### 1:30-2:30 | Enter User Story (60 seconds)

**Story to enter** (choose one):
```
Add Sauce Labs Backpack to cart and verify the cart badge shows 1.
```

OR

```
Login with standard_user and verify the products page loads with at least one product visible.
```

**What to say**:
> "I'm entering a natural language user story. The agent will convert this into a test, explore the actual SauceDemo application, generate Page Objects and Playwright code, execute the test, and if it fails, diagnose and fix it."

**Action**: Paste the user story and press Enter

```
🚀 Starting autonomous test automation workflow...
⏳ This may take 30-60 seconds...
```

**What to say**:
> "The workflow is starting. Let me show you what's happening behind the scenes."

### 2:30-3:30 | Show Live Execution (Phase 1-3) (60 seconds)

**Terminal Output**:
```
[ORCHESTRATOR] ====================================================
[ORCHESTRATOR] Starting autonomous test automation workflow
[ORCHESTRATOR] Run ID: run_1702xxx_abc123
[ORCHESTRATOR] ====================================================

[ORCHESTRATOR] Phase 1: Planning
[PLANNER] Creating test plan from user story
[PLANNER] Test plan created: {
  "scenario": "Add product to cart",
  "products": ["Sauce Labs Backpack"],
  "requiresLogin": true,
  ...
}

[ORCHESTRATOR] Phase 2: Exploration
[EXPLORER] Starting application exploration
[EXPLORER] Navigating to: https://www.saucedemo.com
[EXPLORER] Exploring Login page
[EXPLORER] Login completed
[EXPLORER] Exploring Products page
```

**What to show** (if running headed mode):
- Browser window opens
- SauceDemo login page loads
- Agent automatically logs in
- Explores products page
- Browser closes when exploration done

**What to say**:
> "Phase 1: The Planner analyzed your user story and created a structured test plan. Notice it extracted the exact product name 'Sauce Labs Backpack'—that's critical for accuracy.
>
> Phase 2: The Explorer actually launched a real browser and explored the live SauceDemo application. It discovered UI elements, found stable locators, and logged in automatically. This is NOT mocked."

### 3:30-4:30 | Show Code Generation (Phase 4) (60 seconds)

**Terminal Output**:
```
[ORCHESTRATOR] Phase 3: Code Generation
[GENERATOR] Generating test automation code
[GENERATOR] Generated Page Object: LoginPage.ts
[GENERATOR] Generated Page Object: ProductsPage.ts
[GENERATOR] Generated Page Object: CartPage.ts
[GENERATOR] Generated test file: generated.spec.ts
```

**What to show**:
```bash
# Open the generated test file
cat generated/tests/generated.spec.ts
```

**Display this** (actual generated content):
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.js';
import { ProductsPage } from '../page-objects/ProductsPage.js';
import { CartPage } from '../page-objects/CartPage.js';

test('Add Sauce Labs Backpack to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('standard_user', 'secret_sauce');
  
  const productsPage = new ProductsPage(page);
  await productsPage.addToCart('Sauce Labs Backpack');  // EXACT PRODUCT
  
  const badge = await productsPage.getCartBadge();
  expect(badge).toBe('1');
});
```

**What to say**:
> "Phase 3: Generator created a production-quality Playwright test using Page Object Model. Notice:
> 1. Clean imports
> 2. Proper async/await
> 3. Page Objects separate concerns
> 4. **Exact product name preserved** ('Sauce Labs Backpack')
> 5. Assertions match test plan
>
> This is not generated by a template—it's generated by Gemini reasoning."

### 4:30-5:30 | Watch Test Execution (Phase 4) (60 seconds)

**Terminal Output**:
```
[ORCHESTRATOR] Phase 4: Initial Execution
[EXECUTOR] Starting test execution
[EXECUTOR] Running command: npx playwright test "generated/tests/generated.spec.ts" --headed
...
✓ Add Sauce Labs Backpack to cart (8.2s)

1 passed
```

**If test passes**:
```
[EXECUTOR] Test execution completed
  passed: true
  duration: 8234ms
```

**If test fails** (show this for dramatic effect):
```
[EXECUTOR] Test execution failed
✗ Add Sauce Labs Backpack to cart
  Error: locator('selector-that-changed') could not find element
  
[ORCHESTRATOR] Phase 5: Healing Loop
[HEALER] Healing attempt 1
[HEALER] Diagnosis: Locator not found. Page structure changed.
[HEALER] Correction: Updated locator to '[data-test="add-to-cart"]'
[EXECUTOR] Re-running test after healing
✓ Add Sauce Labs Backpack to cart (7.1s)
```

**What to say**:
> "Phase 4: The Playwright test executed against the REAL SauceDemo application. If it passed, fantastic! If it failed, watch what happens next—the self-healing kicks in.
>
> The Healer Agent:
> 1. Captured the failure output
> 2. Sent it to Gemini for analysis
> 3. Diagnosed the issue
> 4. Applied a correction
> 5. Re-executed the test
> 6. Success!
>
> This is autonomous self-healing—no human intervention."

### 5:30-6:30 | Show Report Generation (60 seconds)

**Terminal Output**:
```
[ORCHESTRATOR] Phase 6: Report Generation
[REPORT] Generating final report
[REPORT] JSON report saved: artifacts/reports/final-report.json
[REPORT] HTML report saved: artifacts/reports/final-report.html
```

**Open the HTML report**:
```bash
# On Windows:
start artifacts/reports/final-report.html

# On Mac:
open artifacts/reports/final-report.html

# On Linux:
firefox artifacts/reports/final-report.html &
```

**What to show in report**:
- Executive Summary section
- Status badge (PASSED in green)
- Test Details (User Story text)
- Execution Flow timeline
- Metrics (duration, healing attempts)
- Generated Files list

**What to say**:
> "Phase 6: A comprehensive HTML report was generated automatically. It includes:
> - Your original user story
> - The AI model used (Gemini 2.0)
> - Execution timeline
> - Any healing attempts and corrections
> - All metrics
>
> No API keys, no passwords—fully sanitized. This can be shared with stakeholders."

### 6:30-7:00 | Final CLI Output (30 seconds)

**Terminal shows**:
```
╔══════════════════════════════════════════════════════════════════════════════╗
║          AUTONOMOUS TEST AUTOMATION COMPLETED                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Scenario:
  Add Sauce Labs Backpack to cart

Initial Execution:
  ❌ FAILED (or ✅ PASSED)

Healing Attempts:
  1 (or 0)

Final Execution:
  ✅ PASSED

Execution Duration:
  23.4 seconds

Report Location:
  artifacts/reports/final-report.html

Run ID:
  run_1702601234_abc123def45

════════════════════════════════════════════════════════════════════════════════
```

**What to say**:
> "And there you have it. The complete end-to-end autonomous workflow:
> 1. Natural language user story as input
> 2. Intelligent planning
> 3. Live application exploration
> 4. Professional code generation
> 5. Real test execution
> 6. Autonomous failure diagnosis
> 7. Self-healing and re-execution
> 8. Comprehensive reporting
>
> All without any human intervention after entering the user story."

### 7:00-8:00 | Show Generated Artifacts (60 seconds)

**Command to explore**:
```bash
ls -la generated/page-objects/
ls -la generated/tests/
ls -la artifacts/
```

**Show these files**:
```
generated/page-objects/
  - LoginPage.ts
  - ProductsPage.ts
  - CartPage.ts
  (etc.)

generated/tests/
  - generated.spec.ts

artifacts/
  - reports/final-report.html
  - reports/final-report.json
  - exploration/ (exploration data)
```

**What to say**:
> "All artifacts are organized and available:
> - Page Objects with clean separation
> - Generated test file with real code
> - HTML and JSON reports
> - Exploration data for debugging
>
> Everything is version-controllable. You could commit the generated test to Git and run it in CI/CD."

### 8:00-9:00 | Key Differentiators (60 seconds)

**What makes this agentic** (point out):

1. **Real Exploration**
   - Not hardcoded selectors
   - Actual browser launch
   - Live page analysis

2. **Intelligent Reasoning**
   - User story → structured plan
   - Failure analysis
   - Targeted corrections

3. **Self-Healing**
   - Diagnoses failures
   - Applies corrections
   - Re-executes automatically

4. **Specialization**
   - 7 focused agents
   - Each expert in domain
   - Coordinated workflow

5. **Production Quality**
   - Page Object Model
   - Clean code
   - Comprehensive testing

**What to say**:
> "This is fundamentally different from:
> - Manual testing (too slow)
> - Simple LLM prompt → code (hallucinated selectors, no self-healing)
> - Test templates (too rigid)
>
> This system actually reasons about requirements, explores the real application, generates intelligent code, executes it, diagnoses failures, and self-heals. That's true autonomous testing."

### 9:00-9:30 | Try Another Story (Optional) (30 seconds)

If time permits:
```bash
npm start --headed
```

Enter a different user story:
```
Login with locked_out_user and verify login fails.
```

**What to show**:
- Agent handles negative scenarios
- Correctly detects locked user error
- Test fails as expected
- Report shows error

### 9:30-10:00 | Wrap Up & Questions (30 seconds)

**Summary**:
> "This autonomous AI test agent demonstrates what's possible when we combine:
> 1. Intelligent AI reasoning (Gemini)
> 2. Live application interaction (Playwright)
> 3. Multi-agent coordination (Orchestrator)
> 4. Self-healing capability (Healer)
> 5. Professional code generation (Generator)
>
> It's production-ready, scalable, and capable of handling real testing scenarios."

**Key Points to Emphasize**:
- ✅ Real browser automation (not simulation)
- ✅ Actual code generation (not template-based)
- ✅ Self-healing (reduces manual intervention)
- ✅ Professional quality output
- ✅ Extensible architecture
- ✅ Comprehensive reporting

**Invite Questions**

---

## Troubleshooting During Demo

### If Test Takes Too Long
- "The Explorer phase involves actual browser launch and interaction—about 15-20 seconds. In production, this would be cached per application."

### If Test Fails
- "Perfect—this actually shows the self-healing in action. Watch as the Healer agent diagnoses and fixes it."

### If Gemini API Error
- "Let me check the API key... [fix and restart]"

### If Playwright Installation Issue
- "Let's install the browser: `npx playwright install chromium`"

---

## Key Talking Points

**Speed**:
- 30-60 seconds from user story to passing test
- vs 2-4 hours manual
- vs 5-10 minutes with simple LLM

**Quality**:
- Page Object Model (best practice)
- Real locators from real app
- Self-healing for robustness

**Scalability**:
- 1 system can generate 1000s of tests
- 24/7 operation
- No human bottleneck

**Autonomy**:
- Enters user story
- Walks away
- Returns to completed test and report

---

**End of demo guide. Total time: ~10 minutes**
