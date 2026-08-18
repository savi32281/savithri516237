/**
 * Masking utility to prevent secrets from appearing in logs and reports
 */

export function maskSensitiveData(text: string): string {
  // Mask common secret patterns
  let masked = text;

  // Mask API keys (format: key=xyz...)
  masked = masked.replace(/api[_-]?key[=\s:]*[\w-]{20,}/gi, 'API_KEY=***MASKED***');

  // Mask passwords
  masked = masked.replace(/password[=\s:]*[\w!@#$%^&*()_\-+=\[\]{};':"\\|,.<>?\/{}`~]*(?=[\s,\n]|$)/gi, 'password=***MASKED***');

  // Mask secret_sauce specifically
  masked = masked.replace(/secret[_-]?sauce/gi, '***MASKED***');

  // Mask Bearer tokens
  masked = masked.replace(/Bearer\s+[\w-]+/gi, 'Bearer ***MASKED***');

  // Mask authorization headers
  masked = masked.replace(/Authorization[=\s:]*Bearer[\s]*[\w-]+/gi, 'Authorization: Bearer ***MASKED***');

  return masked;
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***MASKED***';
  }
  return apiKey.substring(0, 4) + '***MASKED***' + apiKey.substring(apiKey.length - 4);
}

export function shouldMaskInLog(text: string): boolean {
  return (
    text.includes('password') ||
    text.includes('secret') ||
    text.includes('api_key') ||
    text.includes('token') ||
    text.includes('Authorization')
  );
}
