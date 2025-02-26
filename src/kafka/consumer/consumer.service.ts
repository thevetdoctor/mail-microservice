import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { MailService } from 'src/mail/mail.service';
import {
  adminEmail,
  emailUser,
  errorTimeLimit,
  KafkaTopics,
  kafkaUrl,
  MAX_ERRORS,
} from 'src/utils';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private loginErrorCount = 0;
  private errorTimestamps: number[] = [];
  constructor(private readonly mailService: MailService) {}

  async onModuleInit() {
    const kafka = new Kafka({ brokers: [kafkaUrl] });
    const consumer = kafka.consumer({ groupId: 'mail-group' });

    await consumer.connect();
    await consumer.subscribe({
      topics: [
        KafkaTopics.USER_LOGIN,
        KafkaTopics.USER_SIGNUP,
        KafkaTopics.USER_LOGIN_ERROR,
      ],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const msg = JSON.parse(message.value.toString());
          console.log('\n', `🚀 Event Received: ${topic}`, msg, '\n');

          if ([KafkaTopics.USER_LOGIN_ERROR, KafkaTopics.USER_SIGNUP_ERROR].includes(topic as KafkaTopics)) {
            this.trackLoginError(msg);
          } else {
            await this.mailService.sendEmail(msg, topic);
          }
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

  private trackLoginError(msg) {
    const now = Date.now();
    this.errorTimestamps.push(now);
    this.errorTimestamps = this.errorTimestamps.filter(
      (timestamp) => now - timestamp < errorTimeLimit,
    ); // Last 60 seconds
    this.loginErrorCount = this.errorTimestamps.length;
    console.log('loginErrorCount', this.loginErrorCount);

    if (this.loginErrorCount >= MAX_ERRORS) {
      this.sendLoginErrorAlert(msg);
      this.resetErrorTracking();
    }
  }

  private async sendLoginErrorAlert(msg) {
    console.log('⚠️ Sending High Login Error Alert...');
    msg.email = adminEmail;
    await this.mailService.sendEmail(msg, KafkaTopics.USER_LOGIN_ERROR_ALERT);
  }

  private resetErrorTracking() {
    this.loginErrorCount = 0;
    this.errorTimestamps = [];
  }
}
