import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  correlationId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

export interface ErrorLogEntry extends LogEntry {
  stackTrace: string;
  inputSummary: string;
}

export class Logger {
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId ?? uuidv4();
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  info(message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...metadata,
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
    return entry;
  }

  warn(message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...metadata,
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
    return entry;
  }

  error(
    message: string,
    error?: Error | unknown,
    inputSummary?: string,
    metadata?: Record<string, unknown>
  ): ErrorLogEntry {
    const stackTrace =
      error instanceof Error ? error.stack ?? error.message : String(error ?? '');
    const entry: ErrorLogEntry = {
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      stackTrace,
      inputSummary: inputSummary ?? '',
      ...metadata,
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
    return entry;
  }
}
