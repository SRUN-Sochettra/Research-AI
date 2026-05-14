type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        },
      }),
    };

    // In development: pretty print
    if (this.isDevelopment) {
      const prefix = {
        debug: "🔍",
        info: "ℹ️ ",
        warn: "⚠️ ",
        error: "❌",
      }[level];

      console[level === "debug" ? "log" : level](
        `${prefix} [${entry.timestamp}] ${message}`,
        context ? context : "",
        error ? error : ""
      );
    } else {
      // In production: structured JSON logs (for log aggregators)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log("error", message, context, error);
  }

  // Pipeline-specific logging
  pipeline(documentId: string, stage: string, message: string) {
    this.info(`[Pipeline] ${stage}: ${message}`, { documentId, stage });
  }
}

export const logger = new Logger();