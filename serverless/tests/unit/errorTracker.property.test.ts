import fc from 'fast-check';
import { ErrorTracker } from '../../src/services/errorTracker';
import { DynamoDBService } from '../../src/services/dynamodb';
import { LoginErrorItem } from '../../src/types/models';
import { config } from '../../src/utils/constants';

/**
 * Property 3: Error rate threshold triggers alert exactly at boundary
 *
 * For any sequence of error timestamps within the configured time window,
 * the alert is triggered if and only if the count of errors >= MAX_ERRORS.
 * When count < MAX_ERRORS, no alert is triggered.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */
describe('ErrorTracker Property Tests', () => {
  const MAX_ERRORS = config.MAX_ERRORS;

  function buildMockDynamoDB(errorsInWindow: LoginErrorItem[]): DynamoDBService {
    const mock = {
      putLoginError: jest.fn().mockResolvedValue(undefined),
      getLoginErrors: jest.fn().mockResolvedValue(errorsInWindow),
      clearLoginErrors: jest.fn().mockResolvedValue(undefined),
    } as unknown as DynamoDBService;
    return mock;
  }

  function generateErrorItems(count: number, baseTimestamp: number): LoginErrorItem[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `error-${i}`,
      timestamp: baseTimestamp + i,
      email: `user${i}@example.com`,
      clientIp: `192.168.1.${i % 256}`,
      ttl: Math.floor((baseTimestamp + config.ERROR_WINDOW_MS) / 1000),
    }));
  }

  it('Property 3: count >= MAX_ERRORS within window triggers alert; count < MAX_ERRORS does not', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: MAX_ERRORS * 3 }),
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        async (errorCount, baseTimestamp) => {
          const errorsInWindow = generateErrorItems(errorCount, baseTimestamp);
          const mockDynamoDB = buildMockDynamoDB(errorsInWindow);
          const tracker = new ErrorTracker(mockDynamoDB);

          const result = await tracker.trackLoginError({
            email: 'test@example.com',
            clientIp: '10.0.0.1',
          });

          if (errorCount >= MAX_ERRORS) {
            expect(result.alertTriggered).toBe(true);
            expect(mockDynamoDB.clearLoginErrors).toHaveBeenCalled();
          } else {
            expect(result.alertTriggered).toBe(false);
            expect(mockDynamoDB.clearLoginErrors).not.toHaveBeenCalled();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
