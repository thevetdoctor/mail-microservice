import fc from 'fast-check';
import { Logger } from '../../src/utils/logger';

/**
 * Property 6: Structured JSON logging completeness
 *
 * For any arbitrary message string and metadata object, all log output from the
 * Logger is valid JSON containing `correlationId`, `timestamp`, and `level`.
 * Error logs additionally contain `stackTrace` and `inputSummary`.
 *
 * **Validates: Requirements 10.1, 10.3, 10.4**
 */
describe('Logger Property Tests', () => {
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('Property 6a: info() output is valid JSON with correlationId, timestamp, and level', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
        (message, metadata) => {
          stdoutSpy.mockClear();
          const logger = new Logger('prop-test-id');
          logger.info(message, metadata as Record<string, unknown>);

          const output = stdoutSpy.mock.calls[0][0] as string;
          const parsed = JSON.parse(output.trim());

          return (
            typeof parsed.correlationId === 'string' &&
            parsed.correlationId.length > 0 &&
            typeof parsed.timestamp === 'string' &&
            !isNaN(Date.parse(parsed.timestamp)) &&
            parsed.level === 'INFO'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6b: warn() output is valid JSON with correlationId, timestamp, and level', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
        (message, metadata) => {
          stdoutSpy.mockClear();
          const logger = new Logger('prop-test-id');
          logger.warn(message, metadata as Record<string, unknown>);

          const output = stdoutSpy.mock.calls[0][0] as string;
          const parsed = JSON.parse(output.trim());

          return (
            typeof parsed.correlationId === 'string' &&
            parsed.correlationId.length > 0 &&
            typeof parsed.timestamp === 'string' &&
            !isNaN(Date.parse(parsed.timestamp)) &&
            parsed.level === 'WARN'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6c: error() output is valid JSON with correlationId, timestamp, level, stackTrace, and inputSummary', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string(),
        fc.string(),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
        (message, errorMsg, inputSummary, metadata) => {
          stdoutSpy.mockClear();
          const logger = new Logger('prop-test-id');
          const error = new Error(errorMsg);
          logger.error(message, error, inputSummary, metadata as Record<string, unknown>);

          const output = stdoutSpy.mock.calls[0][0] as string;
          const parsed = JSON.parse(output.trim());

          return (
            typeof parsed.correlationId === 'string' &&
            parsed.correlationId.length > 0 &&
            typeof parsed.timestamp === 'string' &&
            !isNaN(Date.parse(parsed.timestamp)) &&
            parsed.level === 'ERROR' &&
            typeof parsed.stackTrace === 'string' &&
            typeof parsed.inputSummary === 'string'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
