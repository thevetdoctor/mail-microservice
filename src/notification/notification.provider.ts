
import { SUBSCRIPTION_REPOSITORY } from 'src/utils';
import { Subscriptions } from './notification.entity';

export const NotificationProviders = [
  {
    provide: SUBSCRIPTION_REPOSITORY,
    useValue: Subscriptions,
  },
];