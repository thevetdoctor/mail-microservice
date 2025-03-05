import { BadRequestException, Injectable } from '@nestjs/common';
import { ProducerService } from 'src/kafka/producer/producer.service';
import {
  checkForRequiredFields,
  getCurrentTime,
  KafkaTopics,
  validateEmailField,
} from 'src/utils';
import { FeedbackDTO } from './feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly kafkaProducer: ProducerService) {}
  async submitFeedback(
    payload: FeedbackDTO,
    clientIp,
    deviceInfo,
  ): Promise<boolean> {
    const currentTime = `${getCurrentTime()} UTC`;
    try {
      checkForRequiredFields(['name', 'email', 'message'], payload);
      validateEmailField(payload.email);

      // 🔥 Send submit feedback event to Kafka
      await this.kafkaProducer.sendMessage(KafkaTopics.SUBMIT_FEEDBACK, {
        ...payload,
        clientIp,
        deviceInfo,
        currentTime,
      });
      return true;
    } catch (e) {
      // 🔥 Send login error event to Kafka
      await this.kafkaProducer.sendMessage(KafkaTopics.SUBMIT_FEEDBACK_ERROR, {
        email: payload.email,
        clientIp,
        deviceInfo,
        currentTime,
        error: e.message,
      });
      throw new BadRequestException(e.message);
    }
  }
}
