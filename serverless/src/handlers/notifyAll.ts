import { Logger } from '../utils/logger';
import { notifyAll, NotificationMessage } from '../services/notification.service';

/**
 * Event payload for the Notify All Lambda handler.
 * Can be triggered manually, by a schedule, or via EventBridge.
 */
export interface NotifyAllEvent {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Response structure returned by the Notify All Lambda handler.
 */
export interface NotifyAllResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  correlationId: string;
}

/**
 * Lambda handler for broadcasting push notifications to all active subscribers.
 *
 * Accepts an event payload with push notification message fields (title, body, url, icon),
 * delegates to the notification service to broadcast, and returns delivery counts.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function handler(event: NotifyAllEvent): Promise<NotifyAllResponse> {
  const logger = new Logger();
  const correlationId = logger.getCorrelationId();

  try {
    logger.info('Notify All Lambda invoked', {
      title: event.title,
      body: event.body,
      url: event.url,
      icon: event.icon,
    });

    const message: NotificationMessage = {
      title: event.title,
      body: event.body,
      url: event.url,
      icon: event.icon,
    };

    const result = await notifyAll(message, logger);

    const total = result.successCount + result.failedEndpoints.length;

    logger.info('Notify All Lambda completed', {
      total,
      successful: result.successCount,
      failed: result.failedEndpoints.length,
    });

    return {
      success: true,
      total,
      successful: result.successCount,
      failed: result.failedEndpoints.length,
      correlationId,
    };
  } catch (error) {
    logger.error(
      'Notify All Lambda failed',
      error,
      JSON.stringify({ title: event.title, body: event.body }),
    );

    return {
      success: false,
      total: 0,
      successful: 0,
      failed: 0,
      correlationId,
    };
  }
}
