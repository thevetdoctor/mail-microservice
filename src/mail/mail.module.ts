import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  imports: [KafkaModule],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
