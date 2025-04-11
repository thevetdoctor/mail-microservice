import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsumerService } from './kafka/consumer/consumer.service';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { ProducerService } from './kafka/producer/producer.service';
import { FeedbackModule } from './feedback/feedback.module';
import { KafkaModule } from './kafka/kafka.module';
import { GatewayAuthMiddleware, LoggerMiddleware } from './middlewares';
import { DatabaseModule } from './database/database.module';
import { NotificationModule } from './notification/notification.module';
// import { AppCacheModule } from './cache/cache.module';

@Module({
  imports: [
    MailModule,
    FeedbackModule,
    KafkaModule,
    DatabaseModule,
    NotificationModule,
    // AppCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConsumerService, MailService, ProducerService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Protect all routes
    consumer.apply(GatewayAuthMiddleware).forRoutes('*'); // Protect all routes
  }
}
