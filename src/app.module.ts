import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsumerService } from './kafka/consumer/consumer.service';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { ProducerService } from './kafka/producer/producer.service';

@Module({
  imports: [MailModule],
  controllers: [AppController],
  providers: [AppService, ConsumerService, MailService, ProducerService],
})
export class AppModule {}
