import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { kafkaUrl } from 'src/utils';

@Injectable()
export class ProducerService implements OnModuleInit {
  private producer: Producer;

  async onModuleInit() {
    const customPartitioner =
      () =>
      ({ partitionMetadata, message }) => {
        // Custom partitioning logic (e.g., random partition)
        return Math.floor(Math.random() * partitionMetadata.length);
      };
    const kafka = new Kafka({ brokers: [kafkaUrl] });
    this.producer = kafka.producer({
      createPartitioner: customPartitioner,
    });
    await this.producer.connect();
  }

  async sendMessage(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
