import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailConfigProviders } from './mailconfig/mailconfig.provider';
import { MailConfigService } from './mailconfig/mailconfig.service';

@Module({
  imports: [KafkaModule],
  controllers: [MailController],
  providers: [MailService, MailConfigService, ...MailConfigProviders],
  exports: [MailConfigService],
})
export class MailModule {}
