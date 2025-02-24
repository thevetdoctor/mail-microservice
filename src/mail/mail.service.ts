import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  emailPass,
  emailUser,
  KafkaTopics,
  mailPort,
  mailSMtpServer,
  mailTemplates,
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

  async sendEmail(msg: any, topic: string) {
    const { email, clientIp, deviceInfo } = msg;
    const { subject, text, html } = mailTemplates(topic, clientIp, deviceInfo);
    await this.kafkaProducer.sendMessage(KafkaTopics.MAIL_SENT, {
      email,
      topic,
    });
    console.log('\n', `Email sent to ${email} by topic: ${topic}`, '\n');
    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
      html,
    });
  }
}
