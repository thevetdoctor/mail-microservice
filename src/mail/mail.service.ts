import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  decrypted,
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
import { ExtendedMailSendDTO } from './mail.dto';
import { MailConfigService } from './mailconfig/mailconfig.service';
dotenv.config();

@Injectable()
export class MailService {
  constructor(
    private readonly kafkaProducer: ProducerService,
    private readonly mailConfigService: MailConfigService,
  ) {}

  async createTransporter(
    apiUser: string = 'consultoba@gmail.com',
  ): Promise<Transporter> {
    try {
      // await this.mailConfigService.generateMailConfig({
      //   email: 'consultoba@gmail.com',
      //   smtpUser: 'consultoba@gmail.com',
      //   smtpPass: '',
      // });
      const mailConfig = await this.mailConfigService.getMailConfig(apiUser);
      const { smtpHost, smtpPort, smtpUser, smtpPass } = mailConfig;
      const decryptedSmtpPass = decrypted(smtpPass);
      console.log('mailConfig', mailConfig, decryptedSmtpPass);
      return nodemailer.createTransport({
        host: smtpHost || mailSMtpServer,
        port: smtpPort || Number(mailPort),
        secure: true,
        auth: {
          user: smtpUser || emailUser,
          pass: decryptedSmtpPass || emailPass,
        },
      });
    } catch (e) {
      throw new NotFoundException(
        `Error creating mail transporter: ${e.message}`,
      );
    }
  }

  async sendEmail(msg: any, topic: string) {
    try {
      const {
        apiUser,
        email,
        clientIp,
        deviceInfo,
        currentTime,
        from,
        to,
        subject,
        message,
        template,
      } = msg;
      const transporter = await this.createTransporter(apiUser);
      const { text, html } = mailTemplates(
        topic,
        clientIp,
        deviceInfo,
        currentTime,
        template || message,
        subject
      );
      await this.kafkaProducer.sendMessage(KafkaTopics.MAIL_SENT, {
        email,
        topic,
      });
      console.log(from, to, message, template);
      console.log(
        '\n',
        `Email sent to ${to || email} by topic: ${topic}`,
        '\n',
      );
      await transporter.sendMail({
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
    payload: ExtendedMailSendDTO,
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
