import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { MailConfigProviders } from 'src/mail/mailconfig/mailconfig.provider';
import { MailConfigService } from 'src/mail/mailconfig/mailconfig.service';
import { ConsumerService } from './consumer/consumer.service';
import { ProducerService } from './producer/producer.service';

@Module({
  providers: [
    ProducerService,
    ConsumerService,
    MailService,
    MailConfigService,
    ...MailConfigProviders,
  ],
  exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}
