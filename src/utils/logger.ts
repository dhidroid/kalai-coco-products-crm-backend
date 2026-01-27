enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const currentLogLevel = LogLevel.DEBUG;

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

export const logger = {
  error: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR] ${message}`, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN] ${message}`, data || '');
    }
  },
  info: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(`[${formatTimestamp()}] [INFO] ${message}`, data || '');
    }
  },
  debug: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, data || '');
    }
  },
};
