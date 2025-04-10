// notification.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { SamplePushDTO, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY } from 'src/utils';
import * as webPush from 'web-push';

// const vapidKeys = webPush.generateVAPIDKeys();
const vapidKeys = `${VAPID_PUBLIC_KEY}: ${VAPID_PRIVATE_KEY}`;
console.log('vapidKeys', vapidKeys);

webPush.setVapidDetails(
  'mailto:consultoba@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

@Injectable()
export class NotificationService {
  async sendPushNotification(subscription: any, payload: SamplePushDTO) {
    try {
      // Send notification
      const payloadStr = JSON.stringify({ payload });
      console.log('subscription', subscription, payloadStr);
      const push = await webPush.sendNotification(subscription, payloadStr);
      return push;
    } catch (error) {
      let errorMessage = 'Error sending push notification';
      if (error.statusCode === 410) {
        errorMessage = error.body.trim();
        console.warn(
          'Push Notification Error:',
          error.statusCode,
          errorMessage,
        );
      } else {
        console.error('Unexpected error:', error.message);
        errorMessage = error.message;
      }
      throw new BadRequestException(errorMessage);
    }
  }
}
