import { Injectable } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { DomainEvent, EventType, MessageConsumer } from '../index';
import { logger } from '@rewards/logger';

@Injectable()
export class KafkaConsumer implements MessageConsumer {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly handlers = new Map<EventType, (event: DomainEvent) => Promise<void>>();

  constructor(brokers: string[], groupId: string) {
    this.kafka = new Kafka({
      clientId: 'rewards-consumer',
      brokers,
      retry: { retries: 5, initialRetryTime: 300, multiplier: 2 },
    });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async subscribe(
    eventType: EventType,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void> {
    this.handlers.set(eventType, handler);
    await this.consumer.subscribe({ topic: eventType, fromBeginning: false });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        if (!message.value) return;

        try {
          const event = JSON.parse(message.value.toString()) as DomainEvent;
          const handler = this.handlers.get(topic as EventType);
          if (handler) {
            await handler(event);
          }
        } catch (error) {
          logger.error({ topic, error }, 'Failed to process message');
        }
      },
    });
    logger.info('KafkaConsumer started');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    logger.info('KafkaConsumer stopped');
  }
}
