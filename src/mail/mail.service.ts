import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  emailPass,
  emailUser,
  KafkaTopics,
  mailPort,
  mailSMtpServer,
} from 'src/utils';
import * as dotenv from 'dotenv';
import { ProducerService } from 'src/kafka/producer/producer.service';
dotenv.config();

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly kafkaProducer: ProducerService) {
    this.transporter = nodemailer.createTransport({
      host: mailSMtpServer,
      port: Number(mailPort),
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, topic: string) {
    await this.kafkaProducer.sendMessage(KafkaTopics.MAIL_SENT, {
      email: to,
      topic,
    });
    console.log('\n', `Email sent to ${to} by topic: ${topic}`, '\n');
    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
  }
}
