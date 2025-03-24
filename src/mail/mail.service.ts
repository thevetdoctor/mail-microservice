import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  emailPass,
  emailUser,
  getCurrentTime,
  KafkaTopics,
  mailPort,
  mailSMtpServer,
  mailTemplates,
} from 'src/utils';
import * as dotenv from 'dotenv';
import { ProducerService } from 'src/kafka/producer/producer.service';
import { MailSendDTO } from './mail.dto';
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
    try {
      const { email, clientIp, deviceInfo, currentTime, from, to, message } =
        msg;
      const { subject, text, html } = mailTemplates(
        topic,
        clientIp,
        deviceInfo,
        currentTime,
        message,
      );
      await this.kafkaProducer.sendMessage(KafkaTopics.MAIL_SENT, {
        email,
        topic,
      });
      console.log('from', from, to, message, process.env.EMAIL_USER);
      console.log(
        '\n',
        `Email sent to ${to || email} by topic: ${topic}`,
        '\n',
      );
      await this.transporter.sendMail({
        from: `${from} <${process.env.EMAIL_USER}>`,
        to: to || email,
        subject,
        text: message || text,
        html,
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async externalSendMail(
    payload: MailSendDTO,
    clientIp,
    deviceInfo,
  ): Promise<boolean> {
    const currentTime = `${getCurrentTime()} UTC`;
    try {
      // 🔥 Send mail send event to Kafka
      await this.kafkaProducer.sendMessage(KafkaTopics.MAIL_SEND, {
        ...payload,
        clientIp,
        deviceInfo,
        currentTime,
      });
      return true;
    } catch (e) {
      // 🔥 Send mail send error event to Kafka
      await this.kafkaProducer.sendMessage(KafkaTopics.MAIL_SEND_ERROR, {
        email: payload.to,
        clientIp,
        deviceInfo,
        currentTime,
        error: e.message,
      });
      throw new BadRequestException(e.message);
    }
  }
}
