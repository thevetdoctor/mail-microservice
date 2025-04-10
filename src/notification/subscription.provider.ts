import { SUBSCRIPTION_REPOSITORY } from 'src/utils';
import { Subscriptions } from './notification.entity';

export const SubscriptionProviders = [
  {
    provide: SUBSCRIPTION_REPOSITORY,
    useValue: Subscriptions,
  },
];
