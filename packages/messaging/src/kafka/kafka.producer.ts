import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { DomainEvent, MessagePublisher } from '../index';
import { logger } from '@rewards/logger';

@Injectable()
export class KafkaProducer implements MessagePublisher, OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor(brokers: string[]) {
    this.kafka = new Kafka({
      clientId: 'rewards-platform',
      brokers,
      retry: { retries: 5, initialRetryTime: 300, multiplier: 2 },
    });
    this.producer = this.kafka.producer({ allowAutoTopicCreation: true });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    logger.info('KafkaProducer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    logger.info('KafkaProducer disconnected');
  }

  async publish(event: DomainEvent): Promise<void> {
    const record: ProducerRecord = {
      topic: event.eventType,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
          headers: {
            'event-id': event.id,
            'event-version': String(event.version),
            'content-type': 'application/json',
          },
        },
      ],
    };

    await this.producer.send(record);
    logger.debug({ eventType: event.eventType, aggregateId: event.aggregateId }, 'Event published');
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e)));
  }
}
