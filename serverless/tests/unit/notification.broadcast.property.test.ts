import * as fc from 'fast-check';
import * as webPush from 'web-push';
import { dynamoDBService } from '../../src/services/dynamodb';
import { notifyAll } from '../../src/services/notification.service';
import { Subscription } from '../../src/types/models';

/**
 * Property 5: Broadcast delivery count invariant
 *
 * For any list of active subscriptions and a notification payload, after broadcasting,
 * the returned successful delivery count SHALL equal the total subscription count
 * minus the number of failed deliveries.
 *
 * Validates: Requirements 8.2, 8.4
 */

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

jest.mock('../../src/utils/constants', () => ({
  config: {
    VAPID_EMAIL: 'mailto:test@example.com',
    VAPID_PUBLIC_KEY: 'test-public-key',
    VAPID_PRIVATE_KEY: 'test-private-key',
  },
}));

// Arbitrary for generating a valid Subscription object
const subscriptionArb = fc.record({
  id: fc.uuid(),
  endpoint: fc.webUrl(),
  keys: fc.record({
    p256dh: fc.base64String({ minLength: 10, maxLength: 50 }),
    auth: fc.base64String({ minLength: 10, maxLength: 30 }),
  }).map((keys) => JSON.stringify(keys)),
  deviceId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  userAgent: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
}) as fc.Arbitrary<Subscription>;

// Arbitrary for a list of subscriptions with per-subscription success/failure outcomes
const subscriptionsWithOutcomesArb = fc
  .array(
    fc.tuple(
      subscriptionArb,
      fc.boolean(), // true = success, false = failure
    ),
    { minLength: 0, maxLength: 20 },
  );

describe('Property 5: Broadcast delivery count invariant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successCount + failedEndpoints.length === total subscriptions for any outcome mix', async () => {
    /**
     * Validates: Requirements 8.2, 8.4
     */
    await fc.assert(
      fc.asyncProperty(subscriptionsWithOutcomesArb, async (subsWithOutcomes) => {
        const subscriptions = subsWithOutcomes.map(([sub]) => sub);
        const outcomes = subsWithOutcomes.map(([, outcome]) => outcome);

        // Mock getAllSubscriptions to return the generated list
        (dynamoDBService.getAllSubscriptions as jest.Mock).mockResolvedValue(subscriptions);
        (dynamoDBService.deleteSubscription as jest.Mock).mockResolvedValue(undefined);

        // Mock sendNotification: succeed or throw based on the generated outcome
        let callIndex = 0;
        (webPush.sendNotification as jest.Mock).mockImplementation(async () => {
          const shouldSucceed = outcomes[callIndex];
          callIndex++;
          if (!shouldSucceed) {
            const error: any = new Error('Push failed');
            error.statusCode = 500;
            throw error;
          }
          return { statusCode: 201 };
        });

        const result = await notifyAll({
          title: 'Test Notification',
          body: 'Test body',
        });

        // Invariant: successCount + failedEndpoints.length === total subscriptions
        expect(result.successCount + result.failedEndpoints.length).toBe(subscriptions.length);
      }),
      { numRuns: 100 },
    );
  });
});
