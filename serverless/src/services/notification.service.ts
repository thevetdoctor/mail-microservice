import * as webPush from 'web-push';
import { config } from '../utils/constants';
import { dynamoDBService } from './dynamodb';
import { Subscription } from '../types/models';
import { Logger } from '../utils/logger';

// Configure web-push with VAPID keys
webPush.setVapidDetails(
  config.VAPID_EMAIL,
  config.VAPID_PUBLIC_KEY,
  config.VAPID_PRIVATE_KEY,
);

export interface NotifyAllResult {
  successCount: number;
  failedEndpoints: string[];
}

export interface NotificationMessage {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Send push notifications to all active subscriptions.
 *
 * Retrieves all subscriptions from DynamoDB, sends a web-push notification
 * to each one. On 410 (Gone) responses, the subscription is deleted from
 * DynamoDB. Returns the count of successful deliveries and the list of
 * failed endpoints.
 */
export async function notifyAll(
  message: NotificationMessage,
  logger?: Logger,
): Promise<NotifyAllResult> {
  const log = logger ?? new Logger();
  const failedEndpoints: string[] = [];
  let successCount = 0;

  // Retrieve all active subscriptions from DynamoDB
  const subscriptions: Subscription[] = await dynamoDBService.getAllSubscriptions();

  log.info('Starting push notification broadcast', {
    totalSubscriptions: subscriptions.length,
    message: { title: message.title, body: message.body },
  });

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url,
    icon: message.icon,
  });

  for (const subscription of subscriptions) {
    try {
      // Parse the keys JSON string stored in DynamoDB
      const keys = JSON.parse(subscription.keys);

      const pushSubscription: webPush.PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      };

      await webPush.sendNotification(pushSubscription, payload);
      successCount++;
    } catch (error: any) {
      const statusCode = error?.statusCode ?? error?.status;

      if (statusCode === 410) {
        // Subscription expired — add to failed list and delete from DynamoDB
        failedEndpoints.push(subscription.endpoint);
        log.warn('Subscription expired (410), removing', {
          endpoint: subscription.endpoint,
          subscriptionId: subscription.id,
        });
        await dynamoDBService.deleteSubscription(subscription.id);
      } else {
        // Other errors — still count as failed but don't delete
        failedEndpoints.push(subscription.endpoint);
        log.error(
          'Push notification delivery failed',
          error,
          JSON.stringify({ endpoint: subscription.endpoint }),
        );
      }
    }
  }

  log.info('Push notification broadcast completed', {
    successCount,
    failedCount: failedEndpoints.length,
    totalSubscriptions: subscriptions.length,
  });

  return { successCount, failedEndpoints };
}
