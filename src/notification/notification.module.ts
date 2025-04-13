import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProviders } from './notification.provider';

@Module({
  providers: [NotificationService, ...NotificationProviders],
  controllers: [NotificationController],
})
export class NotificationModule {}
