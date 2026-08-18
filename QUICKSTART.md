# Quick Start Guide

## 🚀 Get Running in 3 Steps

### Step 1: Configure Gemini API

```bash
# Get your API key from: https://aistudio.google.com/app/apikey
# Then edit the .env file in the project root:

GEMINI_API_KEY=paste_your_key_here
GEMINI_MODEL=gemini-2.0-flash
BASE_URL=https://www.saucedemo.com
MAX_HEAL_ATTEMPTS=2
```

### Step 2: Start the Application

```bash
# Navigate to project directory
cd "c:\Users\savit\OneDrive\Desktop\savithri_Playwright Test Script Generator_agent"

# Run in headed mode (see the browser)
npm start --headed

# OR run in headless mode
npm start
```

### Step 3: Enter a User Story

When prompted, type a user story like:

```
Add Sauce Labs Backpack to cart and verify the cart badge shows 1.
```

Then press Enter and watch the agent work! ✨

## 📊 What Happens Next

1. **Planner** analyzes your story (3-5 seconds)
2. **Explorer** launches browser & discovers UI elements (15-20 seconds)
3. **Generator** creates Page Objects & test code (5-8 seconds)
4. **Executor** runs the Playwright test (10-15 seconds)
5. **Healer** fixes failures if needed (up to 30 seconds)
6. **Reporter** generates final HTML/JSON report

**Total time**: Usually 30-60 seconds

## 📁 Generated Files

After execution, find:

- **Test**: `generated/tests/generated.spec.ts`
- **Page Objects**: `generated/page-objects/`
- **Report (HTML)**: `artifacts/reports/final-report.html` ← View this!
- **Report (JSON)**: `artifacts/reports/final-report.json`

## 🎯 Example User Stories to Try

```
1. Login with standard_user and verify the products page loads with at least one product.

2. Add Sauce Labs Backpack to cart and verify the cart badge shows 1.

3. Add Sauce Labs Backpack and Sauce Labs Bike Light to cart, open cart, and verify both products are there.

4. Login with locked_out_user and verify the login fails with the correct error message.

5. Complete full checkout: login, add Sauce Labs Backpack, proceed to checkout, fill in First Name, Last Name, and Postal Code, complete order, and verify confirmation.
```

## 🔑 Available SauceDemo Credentials

| User | Status |
|------|--------|
| standard_user | ✅ Works normally |
| locked_out_user | 🔒 Locked out |
| problem_user | ⚠️ Visual issues |
| performance_glitch_user | 🐢 Slow |
| error_user | ❌ Shows errors |
| visual_user | 👁️ Visual diffs |

**Password for all**: `secret_sauce` (handled automatically)

## 🛍️ Available Products

- Sauce Labs Backpack
- Sauce Labs Bike Light
- Sauce Labs Bolt T-Shirt
- Sauce Labs Fleece Jacket
- Sauce Labs Onesie
- Test.allTheThings() T-Shirt (Red)

## 🆘 Troubleshooting

### "GEMINI_API_KEY is not set"
→ Edit `.env` file and add your API key

### "Cannot find module '@google/generative-ai'"
→ Run: `npm install`

### "chromium not found"
→ Run: `npx playwright install chromium`

### "Connection to SauceDemo failed"
→ Check internet connection, verify `BASE_URL` in `.env`

### "Test execution failed"
→ Check the HTML report at `artifacts/reports/final-report.html`

## 📚 Learn More

- **README.md** - Comprehensive user guide
- **ARCHITECTURE.md** - System design details
- **DESIGN-WRITEUP.md** - Why this agentic approach is better
- **DEMO-GUIDE.md** - How to present to evaluators
- **IMPLEMENTATION_COMPLETE.md** - Full implementation details

## ✨ Key Features

✅ Real browser automation (not mocked)
✅ Intelligent locator discovery
✅ Page Object Model generation
✅ Professional test code
✅ Autonomous self-healing
✅ Comprehensive reporting
✅ Security (no hardcoded credentials)
✅ Production-ready quality

---

**Ready? Run**: `npm start --headed`

**Questions?** Check the README.md or DEMO-GUIDE.md

**Enjoy! 🎉**
