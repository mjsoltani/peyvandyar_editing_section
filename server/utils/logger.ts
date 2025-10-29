import * as fs from 'fs';
import * as path from 'path';

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  private logLevel: number;
  private logFilePath: string | null;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logFilePath = process.env.LOG_FILE_PATH || null;
    
    // Create log directory if it doesn't exist
    if (this.logFilePath) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private getLogLevel(): number {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LOG_LEVELS[level as keyof LogLevel] ?? LOG_LEVELS.INFO;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  private writeLog(level: string, message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    console.log(formattedMessage);
    
    // File output
    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  error(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      this.writeLog('ERROR', message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      this.writeLog('WARN', message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      this.writeLog('INFO', message, meta);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.DEBUG) {
      this.writeLog('DEBUG', message, meta);
    }
  }

  // Request logging middleware
  requestLogger() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const { method, url, ip } = req;
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        
        this.info(`${method} ${url}`, {
          statusCode,
          duration: `${duration}ms`,
          ip,
          userAgent: req.get('User-Agent')
        });
      });
      
      next();
    };
  }

  // Error logging middleware
  errorLogger() {
    return (error: any, req: any, res: any, next: any) => {
      this.error('Request error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      next(error);
    };
  }
}

export const logger = new Logger();