// notification.service.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY } from 'src/utils';
import * as webPush from 'web-push';
import { SamplePushDTO } from './notification.dto';
import { Subscriptions } from './notification.entity';

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

  constructor(
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepo: typeof Subscriptions,
  ) {}

  async subscribe(subscription: any) {
    try {
      const {
        subscription: { endpoint, keys, deviceId },
        userAgent,
      } = subscription as any;
      const cacheKey = `allSubscriptions`;
      const allSubscriptions = await this.getSubscriptions();
      const subscriptionExist = allSubscriptions.find(
        (sub) => sub.endpoint === endpoint,
      );

      if (!subscriptionExist) {
        console.log(endpoint, keys, deviceId, userAgent);
        console.log(allSubscriptions.length);

        await this.subscriptionRepo.create({
          endpoint,
          deviceId,
          userAgent,
          keys: JSON.stringify(keys),
        });
        console.log('New subscription added:');

        const updatedSubscriptionsList = await this.subscriptionRepo.findAll({
          raw: true,
        });
        // await this.cacheManager.set(
        //   cacheKey,
        //   JSON.stringify(updatedSubscriptionsList),
        //   cacheTtl,
        // );
        return true;
      } else {
        console.log('Subscription already exists:', endpoint);
        console.log(allSubscriptions.length);
        return false;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async notifyAll(message: SamplePushDTO) {
    try {
      const cacheKey = `allSubscriptions`;
      const failedSubscriptions: number[] = [];
      const failedSubscriptionsEndpoints: string[] = [];
      let allSubscriptions = await this.getSubscriptions();

      for (let i = 0; i < allSubscriptions.length; i++) {
        const { endpoint } = allSubscriptions[i];
        const keys = JSON.parse(allSubscriptions[i].keys);
        try {
          await this.sendPushNotification({ endpoint, keys }, message);
        } catch (error) {
          if (error.message.includes('expired')) {
            failedSubscriptions.push(i);
            failedSubscriptionsEndpoints.push(endpoint);
          }
        }
      }
      // Unsubscribe if push failed due to expiration
      // Remove expired subscriptions in reverse to avoid reindexing issues
      // for (let i = failedSubscriptions.length - 1; i >= 0; i--) {
      //   allSubscriptions.splice(failedSubscriptions[i], 1);
      //   await this.subscriptionRepo.destroy({
      //     where: {
      //       endpoint: failedSubscriptionsEndpoints[i],
      //     },
      //   });
      // }

      console.log('failedSubscriptions', failedSubscriptions.length);
      allSubscriptions = allSubscriptions.filter(
        (sub) => !failedSubscriptionsEndpoints.includes(sub.endpoint),
      );

      await this.subscriptionRepo.destroy({
        where: {
          endpoint: failedSubscriptionsEndpoints,
        },
      });
      // await this.cacheManager.set(
      //   cacheKey,
      //   JSON.stringify(allSubscriptions),
      //   cacheTtl,
      // );
      return allSubscriptions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
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

  async getSubscriptions() {
    try {
      const cacheKey = `allSubscriptions`;
      let subscriptions: Subscriptions[] = [];

      // const cachedSubscriptions = await this.cacheManager.get<string>(cacheKey);
      const cachedSubscriptions = false;
      if (cachedSubscriptions) {
        subscriptions = JSON.parse(cachedSubscriptions);
        console.log(
          '✅ Cache Hit:',
          JSON.parse(cachedSubscriptions).length,
          'subscriptions',
          subscriptions.length,
        );
      } else {
        console.log(
          '✅ Cache Miss:',
          // JSON.parse(cachedSubscriptions),
          'subscriptions',
          subscriptions?.length,
        );
        subscriptions = await this.subscriptionRepo.findAll({ raw: true });
        // await this.cacheManager.set(
        //   cacheKey,
        //   JSON.stringify(subscriptions),
        //   cacheTtl,
        // );
      }
      return subscriptions;
    } catch (e) {
      console.log('Error', e.message);
    }
  }
}
