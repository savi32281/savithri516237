# Autonomous AI Playwright Test Script Generator

## Overview

This is a **production-quality autonomous AI test automation agent** that converts natural-language user stories into runnable Playwright tests against the SauceDemo web application. It demonstrates true agentic behavior through:

- **Live application exploration** using Playwright
- **Intelligent locator discovery** via AI reasoning
- **Dynamic test generation** from natural language
- **Real test execution** with Playwright Test
- **Autonomous failure diagnosis** and self-healing
- **Comprehensive reporting** with HTML and JSON outputs

## Key Features

✨ **AI-Powered Test Generation**
- Converts user stories to structured test plans
- Generates Page Object Model (POM) architecture automatically
- Uses Gemini API for intelligent reasoning

🔍 **Live Application Exploration**
- Launches real browser and explores the SauceDemo application
- Discovers UI elements and stable locators
- Analyzes accessibility attributes

🧬 **Self-Healing Capability**
- Diagnoses test failures automatically
- Applies targeted corrections
- Re-executes tests up to configurable attempts

📊 **Professional Reporting**
- HTML and JSON reports
- Execution timeline and metrics
- Failure analysis and healing summary

## Architecture

```
User Story
    ↓
Orchestrator Agent (Main Controller)
    ├→ Planner Agent (Analyzes requirement → Test Plan)
    ├→ Explorer Agent (Explores app → Locators)
    ├→ Generator Agent (Creates Page Objects + Test)
    ├→ Executor Agent (Runs Playwright Test)
    ├→ Healer Agent (Diagnoses & Fixes failures)
    └→ Report Agent (Generates HTML/JSON report)
```

## Technology Stack

- **TypeScript** - Strongly typed JavaScript
- **Playwright** - Browser automation and testing
- **Playwright Test** - Professional test framework
- **Google Gemini API** - AI reasoning engine
- **Node.js** - Runtime
- **dotenv** - Environment configuration

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Valid Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

## Configuration

### .env File

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
BASE_URL=https://www.saucedemo.com
MAX_HEAL_ATTEMPTS=2
```

## Usage

### Run in Headless Mode
```bash
npm start
```

### Run in Headed Mode (see browser)
```bash
npm start --headed
```

### Example User Stories

**Scenario 1 - Valid Login**
```
Login with standard_user and verify the products page loads with at least one product visible.
```

**Scenario 2 - Add Product to Cart**
```
Add Sauce Labs Backpack to cart and verify the cart badge shows 1.
```

**Scenario 3 - Complete Checkout**
```
Login, add Sauce Labs Backpack and Sauce Labs Bike Light to cart, open cart, proceed to checkout, fill in First Name, Last Name, and Postal Code, complete the order, and verify order confirmation.
```

**Scenario 4 - Negative Test (Locked User)**
```
Login with locked_out_user and verify that the correct SauceDemo locked-out error message is displayed.
```

## Workflow

1. **Enter User Story** - Provide a natural language description of what you want to test
2. **Plan** - Agent analyzes the story and creates a structured test plan
3. **Explore** - Agent launches browser and explores the application, discovering UI elements
4. **Generate** - Agent creates Page Objects and Playwright test code
5. **Execute** - Test runs via Playwright Test runner
6. **Heal** (if needed) - If test fails, agent diagnoses the issue and applies fixes
7. **Report** - Comprehensive HTML/JSON report is generated

## Output Files

Generated files are organized as follows:

```
generated/
├── page-objects/      # Page Object Model classes
│   ├── LoginPage.ts
│   ├── ProductsPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── tests/             # Generated Playwright tests
│   └── generated.spec.ts
└── test-data/         # Test data and fixtures
    └── testData.ts

artifacts/
├── reports/           # Final HTML and JSON reports
│   ├── final-report.html
│   └── final-report.json
├── exploration/       # Exploration results and locators
├── screenshots/       # Test failure screenshots
├── traces/           # Playwright traces
└── failures/         # Detailed failure information
```

## Project Structure

```
autonomous-ai-test-agent/
├── src/
│   ├── agents/
│   │   ├── OrchestratorAgent.ts    # Main controller
│   │   ├── PlannerAgent.ts          # Requirement analysis
│   │   ├── ExplorerAgent.ts         # Application exploration
│   │   ├── GeneratorAgent.ts        # Code generation
│   │   ├── ExecutorAgent.ts         # Test execution
│   │   ├── HealerAgent.ts           # Failure analysis & fixing
│   │   └── ReportAgent.ts           # Report generation
│   ├── ai/
│   │   └── GeminiClient.ts          # Gemini API integration
│   ├── mcp/
│   │   └── PlaywrightMcpClient.ts   # MCP client (extensible)
│   ├── models/
│   │   └── AgentState.ts            # State interfaces
│   ├── config/
│   │   └── env.ts                   # Configuration
│   ├── prompts/
│   │   └── prompts.ts               # AI prompts
│   ├── utils/
│   │   ├── logger.ts                # Structured logging
│   │   ├── masking.ts               # Secret masking
│   │   └── fileUtils.ts             # File operations
│   └── main.ts                      # CLI entry point
├── generated/                       # Generated test artifacts
├── artifacts/                       # Reports and exploration data
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── .env
└── README.md
```

## SauceDemo Test Accounts

| Username | Password | Status |
|----------|----------|--------|
| standard_user | secret_sauce | ✅ Works normally |
| locked_out_user | secret_sauce | 🔒 Locked out |
| problem_user | secret_sauce | ⚠️ Visual glitches |
| performance_glitch_user | secret_sauce | 🐢 Slow |
| error_user | secret_sauce | ❌ Errors |
| visual_user | secret_sauce | 👁️ Visual diffs |

## SauceDemo Products

- Sauce Labs Backpack
- Sauce Labs Bike Light
- Sauce Labs Bolt T-Shirt
- Sauce Labs Fleece Jacket
- Sauce Labs Onesie
- Test.allTheThings() T-Shirt (Red)

> ⚠️ **Important**: Always use exact product names from the user story. The agent validates this.

## Advanced Configuration

### Maximum Healing Attempts
```env
MAX_HEAL_ATTEMPTS=3
```

### Gemini Model Selection
```env
GEMINI_MODEL=gemini-2.0-flash
```

### Custom Base URL
```env
BASE_URL=https://www.saucedemo.com
```

## Security & Privacy

✅ **What's Protected:**
- API keys are never logged or included in reports
- Passwords are masked in output
- Secrets are excluded from generated artifacts
- `.env` file is git-ignored

❌ **Never Store:**
- Real API keys in code
- Real passwords in test files
- Credentials in reports

## Troubleshooting

### "GEMINI_API_KEY is not set"
```bash
# Make sure .env file exists and has GEMINI_API_KEY
cp .env.example .env
# Edit .env and add your key
```

### "Connection to SauceDemo failed"
```bash
# Check internet connection
# Verify BASE_URL is correct
# Try accessing https://www.saucedemo.com manually
```

### "Test execution failed"
The agent will automatically attempt to heal the test up to `MAX_HEAL_ATTEMPTS` times. If still failing:
1. Check the generated test file: `generated/tests/generated.spec.ts`
2. Review the HTML report: `artifacts/reports/final-report.html`
3. Check the failure details in `artifacts/failures/`

### "Gemini API errors"
- Verify your API key is valid
- Check your API quota on Google AI Studio
- Try a different Gemini model (e.g., `gemini-1.5-flash`)

## Development

### TypeScript Type Checking
```bash
npm run typecheck
```

### Run Tests
```bash
npm test
```

### Clean Generated Files
```bash
npm run clean
```

## Design Philosophy

This project demonstrates **true agentic behavior** rather than simple automation:

1. **Reasoning** - Uses Gemini AI for intelligent decision-making
2. **Exploration** - Launches real browser to discover actual UI elements
3. **Adaptation** - Dynamically generates tests based on analysis
4. **Diagnosis** - Analyzes failures to determine root cause
5. **Self-Healing** - Automatically corrects issues without human intervention
6. **Reporting** - Provides comprehensive human-readable output

## Limitations

- SauceDemo is a small demo app; some features may not scale to large enterprise applications
- Healing attempts are limited to prevent infinite loops
- Complex multi-page workflows may require more sophisticated locator strategies
- Accessibility-only sites may need custom exploration logic

## Contributing

Contributions welcome! Please ensure:
- TypeScript strict mode compliance
- All agents follow established patterns
- Secrets are never hardcoded
- Tests pass: `npm run typecheck && npm test`

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review generated HTML report
3. Check logs in the terminal output

---

**Built with ❤️ using TypeScript, Playwright, and Gemini AI**
