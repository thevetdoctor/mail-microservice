import fc from 'fast-check';
import { notifyAll } from '../../src/services/notification.service';
import { dynamoDBService } from '../../src/services/dynamodb';
import * as webPush from 'web-push';
import { Subscription } from '../../src/types/models';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

jest.mock('../../src/services/dynamodb', () => ({
  dynamoDBService: {
    getAllSubscriptions: jest.fn(),
    deleteSubscription: jest.fn(),
  },
}));

/**
 * Property 4: Expired subscription cleanup on 410
 *
 * For any list of subscriptions where each subscription either succeeds or
 * receives a 410 (Gone) error, all subscriptions that receive a 410 status
 * SHALL be deleted from DynamoDB, and no subscriptions that succeed or fail
 * with other errors SHALL be deleted.
 *
 * **Validates: Requirements 6.3, 8.3**
 */
describe('Notification Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Property 4: all 410-status subscriptions are deleted, no non-410 subscriptions are deleted', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            endpoint: fc.webUrl(),
            keys: fc.constant(JSON.stringify({ p256dh: 'testP256dh', auth: 'testAuth' })),
            deviceId: fc.constant(undefined),
            userAgent: fc.constant(undefined),
            createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
            updatedAt: fc.constant('2024-01-01T00:00:00.000Z'),
            shouldGet410: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (subscriptionsWithStatus) => {
          // Separate the 410 flag from the subscription data
          const subscriptions: Subscription[] = subscriptionsWithStatus.map(
            ({ shouldGet410, ...sub }) => sub as Subscription
          );
          const statusMap = new Map<string, boolean>(
            subscriptionsWithStatus.map((s) => [s.endpoint, s.shouldGet410])
          );

          // Track which IDs get deleted
          const deletedIds: string[] = [];

          (dynamoDBService.getAllSubscriptions as jest.Mock).mockResolvedValue(subscriptions);
          (dynamoDBService.deleteSubscription as jest.Mock).mockImplementation(async (id: string) => {
            deletedIds.push(id);
          });
          (webPush.sendNotification as jest.Mock).mockImplementation(
            async (pushSub: webPush.PushSubscription) => {
              if (statusMap.get(pushSub.endpoint)) {
                const error: any = new Error('Gone');
                error.statusCode = 410;
                throw error;
              }
              // Success — no throw
            }
          );

          await notifyAll({ title: 'Test', body: 'Test body' });

          // Compute expected deleted IDs (those with 410 status)
          const expectedDeletedIds = subscriptions
            .filter((sub) => statusMap.get(sub.endpoint))
            .map((sub) => sub.id);

          // Assert: all 410 subscriptions are deleted
          for (const id of expectedDeletedIds) {
            expect(deletedIds).toContain(id);
          }

          // Assert: no non-410 subscriptions are deleted
          const nonExpiredIds = subscriptions
            .filter((sub) => !statusMap.get(sub.endpoint))
            .map((sub) => sub.id);
          for (const id of nonExpiredIds) {
            expect(deletedIds).not.toContain(id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
