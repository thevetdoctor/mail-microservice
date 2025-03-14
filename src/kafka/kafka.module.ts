import { Module } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { ConsumerService } from './consumer/consumer.service';
import { ProducerService } from './producer/producer.service';

@Module({
  providers: [ProducerService, ConsumerService, MailService],
  exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}
