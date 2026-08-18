export class Logger {
  private prefix = '';

  constructor(prefix?: string) {
    this.prefix = prefix || '';
  }

  log(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${timestamp}] ${this.prefix} ${message}${dataStr}`);
  }

  error(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    const errorStr = error ? ` ${JSON.stringify(error)}` : '';
    console.error(`[${timestamp}] ${this.prefix} ERROR: ${message}${errorStr}`);
  }

  warn(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.warn(`[${timestamp}] ${this.prefix} WARN: ${message}${dataStr}`);
  }

  info(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.info(`[${timestamp}] ${this.prefix} INFO: ${message}${dataStr}`);
  }

  debug(message: string, data?: unknown): void {
    if (process.env.DEBUG) {
      const timestamp = new Date().toISOString();
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      console.debug(`[${timestamp}] ${this.prefix} DEBUG: ${message}${dataStr}`);
    }
  }
}

export const logger = new Logger();
