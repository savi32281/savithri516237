import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
config({ path: path.join(__dirname, '../../.env') });

export const getConfig = () => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const baseUrl = process.env.BASE_URL || 'https://www.saucedemo.com';
  const maxHealAttempts = parseInt(process.env.MAX_HEAL_ATTEMPTS || '2', 10);

  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please set it in .env file or environment variables.'
    );
  }

  return {
    geminiApiKey,
    geminiModel,
    baseUrl,
    maxHealAttempts,
  };
};

export const saucedemoCredentials = {
  standard_user: { username: 'standard_user', password: 'secret_sauce' },
  locked_out_user: { username: 'locked_out_user', password: 'secret_sauce' },
  problem_user: { username: 'problem_user', password: 'secret_sauce' },
  performance_glitch_user: { username: 'performance_glitch_user', password: 'secret_sauce' },
  error_user: { username: 'error_user', password: 'secret_sauce' },
  visual_user: { username: 'visual_user', password: 'secret_sauce' },
};

export const constants = {
  SAUCEDEMO_URL: 'https://www.saucedemo.com',
  LOGIN_PAGE_PATH: '/',
  PRODUCTS_PAGE_PATH: '/inventory.html',
  CART_PAGE_PATH: '/cart.html',
  CHECKOUT_STEP_ONE_PATH: '/checkout-step-one.html',
  CHECKOUT_STEP_TWO_PATH: '/checkout-step-two.html',
  CHECKOUT_COMPLETE_PATH: '/checkout-complete.html',
  ARTIFACT_DIR: 'artifacts',
  GENERATED_DIR: 'generated',
  REPORTS_DIR: 'artifacts/reports',
  EXPLORATION_DIR: 'artifacts/exploration',
  DEFAULT_TIMEOUT: 30000,
};
