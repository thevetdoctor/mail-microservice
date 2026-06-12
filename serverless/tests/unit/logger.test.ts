import { Logger, LogEntry, ErrorLogEntry } from '../../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('test-correlation-id');
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should generate a UUID v4 correlation ID if none provided', () => {
      const autoLogger = new Logger();
      const id = autoLogger.getCorrelationId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should use provided correlation ID', () => {
      expect(logger.getCorrelationId()).toBe('test-correlation-id');
    });
  });

  describe('setCorrelationId', () => {
    it('should update the correlation ID', () => {
      logger.setCorrelationId('new-id');
      expect(logger.getCorrelationId()).toBe('new-id');
    });
  });

  describe('info', () => {
    it('should output valid JSON with required fields', () => {
      logger.info('test message');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed: LogEntry = JSON.parse(output.trim());

      expect(parsed.correlationId).toBe('test-correlation-id');
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('test message');
      expect(parsed.timestamp).toBeDefined();
      expect(() => new Date(parsed.timestamp)).not.toThrow();
    });

    it('should include metadata in the log entry', () => {
      logger.info('with metadata', { requestId: '123', path: '/test' });

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed.requestId).toBe('123');
      expect(parsed.path).toBe('/test');
    });

    it('should return the log entry', () => {
      const entry = logger.info('returned entry');
      expect(entry.level).toBe('INFO');
      expect(entry.message).toBe('returned entry');
    });
  });

  describe('warn', () => {
    it('should output valid JSON with WARN level', () => {
      logger.warn('warning message');

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed: LogEntry = JSON.parse(output.trim());

      expect(parsed.correlationId).toBe('test-correlation-id');
      expect(parsed.level).toBe('WARN');
      expect(parsed.message).toBe('warning message');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include metadata', () => {
      logger.warn('warn with meta', { code: 'TIMEOUT' });

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed.code).toBe('TIMEOUT');
    });
  });

  describe('error', () => {
    it('should output valid JSON with ERROR level, stackTrace and inputSummary', () => {
      const err = new Error('something broke');
      logger.error('error occurred', err, '{"email":"test@example.com"}');

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed: ErrorLogEntry = JSON.parse(output.trim());

      expect(parsed.correlationId).toBe('test-correlation-id');
      expect(parsed.level).toBe('ERROR');
      expect(parsed.message).toBe('error occurred');
      expect(parsed.stackTrace).toContain('something broke');
      expect(parsed.inputSummary).toBe('{"email":"test@example.com"}');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should handle non-Error objects as the error parameter', () => {
      logger.error('string error', 'raw error string', 'input');

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed: ErrorLogEntry = JSON.parse(output.trim());

      expect(parsed.stackTrace).toBe('raw error string');
    });

    it('should handle undefined error and inputSummary', () => {
      logger.error('no error object');

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed: ErrorLogEntry = JSON.parse(output.trim());

      expect(parsed.stackTrace).toBe('');
      expect(parsed.inputSummary).toBe('');
    });

    it('should include metadata in error entries', () => {
      logger.error('with meta', new Error('e'), 'summary', { handler: 'feedback' });

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed.handler).toBe('feedback');
    });
  });
});
