import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
// import { CacheModule } from '@nestjs/cache-manager';
import { SubscriptionProviders } from './subscription.provider';
import { AppCacheModule } from 'src/cache/cache.module';

@Module({
  imports: [AppCacheModule],
  providers: [NotificationService, ...SubscriptionProviders],
  controllers: [NotificationController],
})
export class NotificationModule {}
