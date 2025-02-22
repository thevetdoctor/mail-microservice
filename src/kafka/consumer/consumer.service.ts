import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { MailService } from 'src/mail/mail.service';
import { KafkaTopics, kafkaUrl, mailTemplates } from 'src/utils';

@Injectable()
export class ConsumerService implements OnModuleInit {
  constructor(private readonly mailService: MailService) {}

  async onModuleInit() {
    const kafka = new Kafka({ brokers: [kafkaUrl] });
    const consumer = kafka.consumer({ groupId: 'mail-group' });

    await consumer.connect();
    await consumer.subscribe({
      topics: [KafkaTopics.USER_LOGIN, KafkaTopics.USER_SIGNUP],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const msg = JSON.parse(message.value.toString());
          console.log('\n', `🚀 Event Received: ${topic}`, msg, '\n');
          await this.mailService.sendEmail(
            msg.email,
            mailTemplates[topic].subject,
            mailTemplates[topic].text,
            topic,
          );
        } catch (e) {
          console.log(
            '\n',
            'error with Kafka sendEmail action',
            e.message,
            '\n',
          );
        }
      },
    });
  }
}
